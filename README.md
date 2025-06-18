# Cv

## Deal Manager LWC

This repository now includes a basic Lightning Web Component for managing deals and bank requests in Salesforce.

The component is located in `force-app/main/default/lwc/dealManager`. It displays opportunities in a table with actions to create new bank requests, view existing requests, and update the deal stage.

The Apex controller `DealController` provides server-side logic to query opportunities and related cases, create new cases, and update records.

To use this component, deploy the `force-app` directory to your Salesforce org using `sfdx force:source:deploy`.
