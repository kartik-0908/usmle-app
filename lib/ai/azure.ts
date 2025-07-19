import { createAzure } from '@ai-sdk/azure';

export const azure = createAzure({
  resourceName: 'makai-azurespon', // Azure resource name
  apiKey: process.env.AZURE_API_KEY, // Your Azure API key
});