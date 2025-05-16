import AWS from './aws-config';
import { v4 as uuidv4 } from 'uuid';

function getDynamo() {
  return new AWS.DynamoDB.DocumentClient();
}

export const addItem = (tableName, item) => {
  const params = {
    TableName: tableName,
    Item: {
      ...item,
      id: uuidv4(), // Add a random UUID as the id
    },
  };
  return getDynamo().put(params).promise();
};

export const fetchItems = async (tableName, sortColumn = null, sortOrder = "asc") => {
  const params = {
    TableName: tableName,
  };
  const result = await getDynamo().scan(params).promise();

  if (sortColumn) {
    // Sort items based on the provided column and order
    result.Items.sort((a, b) => {
      if (!a[sortColumn] && !b[sortColumn]) return 0; // Both undefined
      if (!a[sortColumn]) return sortOrder === 'asc' ? 1 : -1; // `a` undefined
      if (!b[sortColumn]) return sortOrder === 'asc' ? -1 : 1; // `b` undefined

      if (typeof a[sortColumn] === 'string' && typeof b[sortColumn] === 'string') {
        return sortOrder === 'asc'
          ? a[sortColumn].localeCompare(b[sortColumn])
          : b[sortColumn].localeCompare(a[sortColumn]);
      }

      return sortOrder === 'asc'
        ? a[sortColumn] - b[sortColumn]
        : b[sortColumn] - a[sortColumn];
    });
  }

  return result.Items;
};

export const updateItem = async (tableName, key, updatedValues) => {
  try {
    // Construct the UpdateExpression and ExpressionAttributeValues dynamically
    const updateExpressionParts = [];
    const expressionAttributeValues = {};
    const expressionAttributeNames = {};

    for (const [attribute, value] of Object.entries(updatedValues)) {
      const placeholder = `#${attribute}`;
      const valuePlaceholder = `:${attribute}`;
      updateExpressionParts.push(`${placeholder} = ${valuePlaceholder}`);
      expressionAttributeValues[valuePlaceholder] = value;
      expressionAttributeNames[placeholder] = attribute; // Use names to handle reserved keywords
    }

    const params = {
      TableName: tableName,
      Key: key,
      UpdateExpression: `SET ${updateExpressionParts.join(', ')}`,
      ExpressionAttributeValues: expressionAttributeValues,
      ExpressionAttributeNames: expressionAttributeNames,
      ReturnValues: 'UPDATED_NEW',
    };

    const result = await getDynamo().update(params).promise();
    return result.Attributes; // Returns the updated attributes
  } catch (error) {
    console.error('Error updating item:', error);
    throw error;
  }
}

export const deleteItem = async (tableName, key) => {
  try {
    const params = {
      TableName: tableName,
      Key: key,
    };

    await getDynamo().delete(params).promise();
    console.log(`Item deleted from ${tableName}`);
  } catch (error) {
    console.error("Error deleting item:", error);
    throw error;
  }
}
