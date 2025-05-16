import AWS from './aws-config';
const dynamodb = new AWS.DynamoDB.DocumentClient();

export const addItem = (tableName, item) => {
  const params = {
    TableName: tableName,
    Item: item,
  };
  return dynamodb.put(params).promise();
};

export const fetchItems = async (tableName) => {
  const params = {
    TableName: tableName,
  };
  const result = await dynamodb.scan(params).promise();
  return result.Items;
};

export const updateItem = async (tableName, key, updates) => {
  // Construct the UpdateExpression and ExpressionAttributeValues dynamically
  let updateExpression = 'set';
  const expressionAttributeValues = {};

  // Loop through the updates object and build the expression and values
  for (const [attribute, value] of Object.entries(updates)) {
    const placeholder = `:${attribute}`;
    updateExpression += ` ${attribute} = ${placeholder},`;
    expressionAttributeValues[placeholder] = value;
  }

  // Remove trailing comma
  updateExpression = updateExpression.slice(0, -1);

  const params = {
    TableName: tableName,
    Key: key,
    UpdateExpression: updateExpression,
    ExpressionAttributeValues: expressionAttributeValues,
    ReturnValues: 'UPDATED_NEW', // Return only updated attributes
  };

  try {
    const result = await dynamodb.update(params).promise();
    console.log('Item updated successfully:', result);
  } catch (error) {
    console.error('Error updating item:', error);
  }
};

// Add other CRUD operations as needed
