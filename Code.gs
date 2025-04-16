
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('K-pop Merch Buying Solution')
    .addItem('Initialize Workspace', 'initializeWorkspace')
    .addItem('Clear Workspace', 'clearWorkspace')
    .addItem('Assign Products to Orders', 'assignProductsToOrders')
    .addItem('Estimate Probability Next Purchase Improves Score', 'estimateProbabilityNextPurchaseImprovesScore')
    .addToUi();
}

/*
  USER-FACING FUNCTIONS
*/

function initializeWorkspace() {
  const ui = SpreadsheetApp.getUi();
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const response = ui.prompt(
    'Number of Picks',
    'Enter how many picks each order is allowed (1 to 10):',
    ui.ButtonSet.OK_CANCEL
  );

  if (response.getSelectedButton() !== ui.Button.OK) return;

  const numPicks = parseInt(response.getResponseText(), 10);
  if (isNaN(numPicks) || numPicks < 1 || numPicks > 10) {
    handleError('Please enter a valid number between 1 and 10.');
  }

  const orderHeaders = ['id'];
  const rankSuffixes = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth'];
  for (let i = 1; i <= numPicks; i++) {
    orderHeaders.push(rankSuffixes[i - 1] + '_pick');
  }

  const desiredSheets = [
    'main',
    'orders',
    'products',
    'possible_products',
    'satisfaction_scoring_rules',
    'assignment_result'
  ];

  const headersMap = {
    'main': ['current_satisfaction_score', 'probability_next_purchase_improves_score'],
    'orders': orderHeaders,
    'products': ['id', 'product_type'],
    'possible_products': ['product_type'],
    'satisfaction_scoring_rules': ['pick_level', 'score'],
    'assignment_result': ['id', 'timestamp', 'total_satisfaction_score']
  };

  desiredSheets.forEach(function(name) {
    let sheet = ss.getSheetByName(name);
    if (!sheet) {
      sheet = ss.insertSheet(name);
    } else {
      sheet.clear();
    }
    sheet.appendRow(headersMap[name]);

    if (name === 'satisfaction_scoring_rules') {
      for (let i = 0; i < numPicks; i++) {
        const pick = rankSuffixes[i];
        const score = numPicks - i;
        sheet.appendRow([pick, score]);
      }
    }
  });

  const allSheets = ss.getSheets();
  const sheetsToDelete = allSheets.filter(function(sheet) {
    return desiredSheets.indexOf(sheet.getName()) === -1;
  });

  if (allSheets.length - sheetsToDelete.length >= 1) {
    sheetsToDelete.forEach(function(sheet) {
      ss.deleteSheet(sheet);
    });
  } else {
    handleError('Cannot delete all sheets — at least one sheet must remain.');
  }

  SpreadsheetApp.flush();
}

function clearWorkspace() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetsToClear = [
    'main',
    'orders',
    'products',
    'possible_products',
    'assignment_result'
  ];
  
  sheetsToClear.forEach(function(sheetName) {
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      handleError('Sheet "' + sheetName + '" not found.');
    } else {
      const lastRow = sheet.getLastRow();
      if (lastRow > 1) {
        sheet.getRange(2, 1, lastRow - 1, sheet.getMaxColumns()).clearContent();
      }
    }
  });
}

function assignProductsToOrders() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ordersSheet = ss.getSheetByName('orders');
  const productsSheet = ss.getSheetByName('products');
  const scoringRulesSheet = ss.getSheetByName('satisfaction_scoring_rules');

  if (!ordersSheet || !productsSheet || !scoringRulesSheet) {
    handleError('One or more required sheets (orders, products, satisfaction_scoring_rules) are missing.');
  }

  const ordersData = readSheetData(ordersSheet);
  const ordersHeaders = ordersData.headers;
  const orders = ordersData.rows;

  const productsData = readSheetData(productsSheet);
  const products = productsData.rows;

  const scoringData = readSheetData(scoringRulesSheet).rows;
  const satisfaction = {};
  scoringData.forEach(function(row) {
    satisfaction[row['pick_level']] = row['score'];
  });

  const weightMatrix = buildWeightMatrix(orders, ordersHeaders, products, satisfaction);
  const numOrders = orders.length;
  const numProducts = products.length;

  const costMatrix = buildCostMatrix(weightMatrix);

  const assignment = hungarianAlgorithm(costMatrix);

  let totalSatisfaction = 0;
  const assignedResults = [];
  for (let i = 0; i < numOrders; i++) {
    const assignedCol = assignment[i];
    let assignedProduct = '';

    if (assignedCol < numProducts && weightMatrix[i][assignedCol] > -1000000) {
      assignedProduct = products[assignedCol]['product_type'];
      totalSatisfaction += weightMatrix[i][assignedCol];
    }
    assignedResults.push([assignedProduct]);
  }

  let assignedProductIndex = ordersHeaders.indexOf('assigned_product');
  if (assignedProductIndex === -1) {
    assignedProductIndex = ordersHeaders.length;
    ordersSheet.getRange(1, assignedProductIndex + 1).setValue('assigned_product');
  }
  ordersSheet
    .getRange(2, assignedProductIndex + 1, assignedResults.length, 1)
    .setValues(assignedResults);

  const assignmentResultSheet = ss.getSheetByName('assignment_result');
  if (!assignmentResultSheet) {
    handleError('Sheet "assignment_result" not found.');
  }

  const uniqueId = Utilities.getUuid();
  const timestamp = new Date();
  assignmentResultSheet.appendRow([uniqueId, timestamp, totalSatisfaction]);

  updateCurrentSatisfactionScore();
}

function estimateProbabilityNextPurchaseImprovesScore() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ordersSheet = ss.getSheetByName('orders');
  const productsSheet = ss.getSheetByName('products');
  const possibleProductSheet = ss.getSheetByName('possible_products');
  const scoringRulesSheet = ss.getSheetByName('satisfaction_scoring_rules');

  if (!ordersSheet || !productsSheet || !possibleProductSheet || !scoringRulesSheet) {
    handleError(
      'One or more required sheets (orders, products, possible_products, satisfaction_scoring_rules) are missing.'
    );
    return;
  }

  const ordersData = readSheetData(ordersSheet);
  const ordersHeaders = ordersData.headers;
  const orders = ordersData.rows;

  const products = readSheetData(productsSheet).rows;

  const possibleProdData = readSheetData(possibleProductSheet).rows;
  if (possibleProdData.length === 0) {
    handleError('No possible products found. Please add to "possible_products" before running the estimator.');
    return;
  }

  const possibleProducts = possibleProdData.map(function(r) {
    return r['product_type'];
  });

  const scoringData = readSheetData(scoringRulesSheet).rows;
  const satisfaction = {};
  scoringData.forEach(function(row) {
    satisfaction[row['pick_level']] = row['score'];
  });

  const currentSatisfactionScore = getCurrentSatisfactionScore();
  
  const improvedProductTypes = [];

  possibleProducts.forEach(function(productType) {
    let simulatedProducts = products.slice();
    simulatedProducts.push({ product_type: productType });

    const simWeightMatrix = buildWeightMatrix(orders, ordersHeaders, simulatedProducts, satisfaction);
    const simCostMatrix = buildCostMatrix(simWeightMatrix);
    const assignment = hungarianAlgorithm(simCostMatrix);

    let totalSatisfaction = 0;
    for (let i = 0; i < orders.length; i++) {
      const assignedCol = assignment[i];
      if (assignedCol < simulatedProducts.length && simWeightMatrix[i][assignedCol] > -1000000) {
        totalSatisfaction += simWeightMatrix[i][assignedCol];
      }
    }

    if (totalSatisfaction > currentSatisfactionScore) {
      improvedProductTypes.push(productType);
    }
  });

  const probability = possibleProducts.length > 0 ? improvedProductTypes.length / possibleProducts.length : 0;

  const mainSheet = ss.getSheetByName('main');
  const mainData = mainSheet.getDataRange().getValues();
  const mainHeaders = mainData[0];

  const resultColIndex = mainHeaders.indexOf('probability_next_purchase_improves_score');
  if (resultColIndex === -1) {
    handleError('Column "probability_next_purchase_improves_score" not found in "main" sheet.');
    return;
  }
  mainSheet.getRange(2, resultColIndex + 1).setValue(probability);
}

/*
  UTILITIES
*/

function handleError(errorMessage) {
  const ui = SpreadsheetApp.getUi();
  ui.alert('Error', errorMessage, ui.ButtonSet.OK);
  throw new Error(errorMessage);
}

function readSheetData(sheet) {
  if (!sheet) {
    handleError('Provided sheet is not found or is undefined.');
  }
  const data = sheet.getDataRange().getValues();
  if (data.length === 0) {
    handleError('Sheet "' + sheet.getName() + '" is empty or has no rows.');
  }

  const headers = data[0];
  const rows = [];
  for (let i = 1; i < data.length; i++) {
    const rowObj = {};
    for (let j = 0; j < headers.length; j++) {
      rowObj[headers[j]] = data[i][j];
    }
    rows.push(rowObj);
  }

  return { headers, rows };
}

function buildWeightMatrix(orders, orderHeaders, products, satisfaction) {
  const numOrders = orders.length;
  const numProducts = products.length;
  const disallowedWeight = -1000000;
  const weightMatrix = [];

  for (let i = 0; i < numOrders; i++) {
    const order = orders[i];
    const row = [];
    for (let j = 0; j < numProducts; j++) {
      const product = products[j];
      let weight = disallowedWeight;

      for (let k = 1; k < orderHeaders.length; k++) {
        const header = orderHeaders[k];
        if (header.endsWith('_pick')) {
          if (order[header] && order[header].toString() === product['product_type'].toString()) {
            const rank = header.split('_')[0];
            weight = satisfaction[rank] !== undefined ? satisfaction[rank] : 0;
            break;
          }
        }
      }
      row.push(weight);
    }
    weightMatrix.push(row);
  }

  return weightMatrix;
}

function buildCostMatrix(weightMatrix) {
  const n = weightMatrix.length;
  const m = weightMatrix[0].length;

  const size = Math.max(n, m);
  const costMatrix = [];

  for (let i = 0; i < size; i++) {
    const row = [];
    for (let j = 0; j < size; j++) {
      if (i < n && j < m) {
        row.push(-weightMatrix[i][j]);
      } else {
        row.push(0);
      }
    }
    costMatrix.push(row);
  }

  return costMatrix;
}

function hungarianAlgorithm(costMatrix) {
  const n = costMatrix.length;
  const u = new Array(n + 1).fill(0);
  const v = new Array(n + 1).fill(0);
  const p = new Array(n + 1).fill(0);
  const way = new Array(n + 1).fill(0);

  for (let i = 1; i <= n; i++) {
    p[0] = i;
    const minv = new Array(n + 1).fill(Infinity);
    const used = new Array(n + 1).fill(false);
    let j0 = 0;
    do {
      used[j0] = true;
      const i0 = p[j0];
      let delta = Infinity;
      let j1 = 0;
      for (let j = 1; j <= n; j++) {
        if (!used[j]) {
          const cur = costMatrix[i0 - 1][j - 1] - u[i0] - v[j];
          if (cur < minv[j]) {
            minv[j] = cur;
            way[j] = j0;
          }
          if (minv[j] < delta) {
            delta = minv[j];
            j1 = j;
          }
        }
      }
      for (let j = 0; j <= n; j++) {
        if (used[j]) {
          u[p[j]] += delta;
          v[j] -= delta;
        } else {
          minv[j] -= delta;
        }
      }
      j0 = j1;
    } while (p[j0] !== 0);
    do {
      const j1 = way[j0];
      p[j0] = p[j1];
      j0 = j1;
    } while (j0);
  }

  const result = new Array(n);
  for (let j = 1; j <= n; j++) {
    if (p[j] > 0) {
      result[p[j] - 1] = j - 1;
    }
  }
  return result;
}

function updateCurrentSatisfactionScore() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const assignmentSheet = ss.getSheetByName('assignment_result');
  const mainSheet = ss.getSheetByName('main');

  if (!assignmentSheet || !mainSheet) {
    handleError('Either "assignment_result" or "main" sheet is missing.');
  }

  const { headers, rows } = readSheetData(assignmentSheet);
  const timestampIndex = headers.indexOf('timestamp');
  const scoreIndex = headers.indexOf('total_satisfaction_score');

  if (timestampIndex === -1 || scoreIndex === -1) {
    handleError('The "assignment_result" sheet must have "timestamp" and "total_satisfaction_score" columns.');
  }

  let latestRow = null;
  let maxTimestamp = 0;

  rows.forEach(row => {
    const rowTimestamp = new Date(row['timestamp']).getTime();
    if (rowTimestamp > maxTimestamp) {
      maxTimestamp = rowTimestamp;
      latestRow = row;
    }
  });

  if (!latestRow) {
    handleError('No data found in "assignment_result" sheet.');
  }

  const currentSatisfactionScore = latestRow['total_satisfaction_score'];

  const mainData = mainSheet.getDataRange().getValues();
  const mainHeaders = mainData[0];
  const scoreColIndex = mainHeaders.indexOf('current_satisfaction_score');

  if (scoreColIndex === -1) {
    handleError('Column "current_satisfaction_score" not found in "main" sheet.');
  }

  mainSheet.getRange(2, scoreColIndex + 1).setValue(currentSatisfactionScore);
}

function getCurrentSatisfactionScore() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const mainSheet = ss.getSheetByName('main');

  if (!mainSheet) {
    handleError('Sheet "main" not found.');
  }

  const data = mainSheet.getDataRange().getValues();
  if (data.length < 2) {
    handleError('"main" sheet does not contain any data rows beyond the header.');
  }

  const headers = data[0];
  const scoreColIndex = headers.indexOf('current_satisfaction_score');
  if (scoreColIndex === -1) {
    handleError('Column "current_satisfaction_score" not found in "main" sheet.');
  }

  const currentSatisfactionScore = data[1][scoreColIndex];
  if (currentSatisfactionScore === '' || currentSatisfactionScore == null) {
    handleError('"current_satisfaction_score" in "main" sheet is empty or undefined.');
  }

  return currentSatisfactionScore;
}
