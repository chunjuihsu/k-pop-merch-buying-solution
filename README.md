# Kpop Merch Buying Solution

The project aims to help Kpop Merch Buyers scale their businesses.

## Background

The storm of Kpop has taken over the world, creating fans all over the world wanting to get the latest, limited, exclusive merches of their idols. Despite the huge demand world wide, the supply of them has been historically confined to the Korea. Many of the merches will only be released in Korea or will only be firstly available in the Korean market. Kpop merch buyers emerged in this background. They live in Korea, receiving orders world wide, helping their clients get the merches they want, satisfying the dream of Kpop fans in the every corner of the world.

My friend is one of those Kpop buyers. One day, I went to her new apartment for a housewarming party, and I noticed piles of boxes that were for Kpop merches piled on the ground. I asked how long it usually take for her to ship all of them to the customers. She replied that it might take up to a week, and stated her problems...

## The Business Problem

When Kpop buyers go to buy Kpop merches, they rarely can select the exact item that they want to buy. As a sales tactic, Kpop companies usually sell the merch as mystery box.

For example, a Kpop company is selling cards for its Kpop group, which has ten members. Instead of selling the cards for each member stand alone, the company sell the cards as mystery box, which a customer cannot know what is inside before the purchase. A customer can only know the idol of the card that he or she purchased after openning the box. Often, they won't find the card of their most wanted idol, which causes them to buy another - a true sales tactic!

Due to this uncertainty, when Kpop buyers take order from their customers, they usually allow the customers to choose more than one items that they want from the mystery box in need. This is to avoid the Kpop buyer can never get the items that the customer wants, and to manage the cost it requires for each order, which will be reflected in a more reasonable quote to the purchasement request.

But this creates two problems:

1. It takes time to allocate the products as each customer has more than one pick.
2. The Kpop buyer doesn't know whether to buy one more mystery box to see whether there will be something wanted. The more mystery box the Kpop buyer buys, the higher the total cost to deliver the orders, and hence, the less profit it gots!

As a data analyst, I soon understand that it is an assignment and probability problems. I said that I can help, and here comes the solutions.

## The Solutions

The solution provides two core functions to solve the presented busieness problems:

1. One-click assign prodcuts to orders in a way that best satisfies each customer's need.
2. Estimate the probablity that your next purchase can result in items that better satisfy the customers need, i.e., the probablity that the next purchase will be items on a higer priority pick of your customers.

## Getting Started

### Step One: Use your account to create a google spreadsheet

### Step One: Open App Script through the spreadsheet

### Step Two (Optional): Authorize your account to have the permission to this project

If on Step Five, you are prompted with 'Authorization required', you will need to authorize your account to have the permission to this project.

Technically, what you will do is making this project allowing access for your account since this is your project.

To do so, follow instruction stated in this tutoiral: https://web.archive.org/web/20230207010146/https://aimanfikri.com/2022/05/09/this-app-is-blocked-error-on-google-apps-script-solution/

### Step Three: Copy and paste the code in app.gs to the the editor in App Script

By default, there will be a file called Code.gs. You can paste the code in it, but you can also past the code in any other file if you want.

### Step Four: Go back to the sheet and refresh.

After refreshing, you should see a new tab 'Kpop Merch Bying Solution' in the menu.

### Step Five: Click 'Kpop Merch Bying Solution' and click 'Initialize Workspace'

You will be asked to enter how many picks each order is allowed.

For example, you allow your customer to have up to three picks per order, key in 3. Remember that you can only key in a number from 1 to 10.

After the initialization, you will have six sheets in the file: 'main', 'orders', 'products', 'possible_products', 'satisfaction_scoring_rules', 'assignment_result'.

There will be columns initialized for each sheet, and you can see there is default values in 'satsifaction_scoring_rules'

### Step Six: Fill in possible products

Suppose you are buying a product with seven types, i.e., a mystery box with sevent different results.

Fill in all these sevent possible proudct types in 'possible_products', as shown in the screenshot.

In this example, we have: 'apple', 'banana', 'orange', 'grapes', 'strawberry', 'water mellon', 'pineapple'

### Step Seven: Fill in your order data

Suppose you have collected the orders from your customers, and in total you have five. Each of them choose from one two three products that they want.

The data should look like this:

| id | first_pick   | second_pick   | third_pick  |
|----|--------------|---------------|-------------|
| 1  | apple        |               |             |
| 2  | apple        | water mellon  | strawberry  |
| 3  | banana       | pineapple     |             |
| 4  | orange       | banana        | grapes      |
| 5  | grapes       | water mellon  |             |

The first order has only one pick: apple, meaning that the customer wants only apple, and receiving apply, he or she will be the most satisfied.

The second order has three orders. The first one is apply, the second one is water mellon, and the third one is strawberry. This means that the second customer is ok in receiving apple, water mellon, or starberry, but he or she will be the most satisfied if he or she receives an apple.

Fill this data in the 'orders' sheet as shown in the screenshot:

### Step Eight: Go to buy the products and put the products you have in 'products'



