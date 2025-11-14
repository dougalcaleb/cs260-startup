import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { SERVER_REGION } from "../config.js";

const dynamoClient = new DynamoDBClient({ 
	region: process.env.AWS_REGION || SERVER_REGION
});

export const ddClient = DynamoDBDocumentClient.from(dynamoClient);
