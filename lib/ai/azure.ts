import { createAzure } from '@ai-sdk/azure';

export const azure = createAzure({
  resourceName: 'makai-azurespon', // Azure resource name
  apiKey: process.env.AZURE_API_KEY, // Your Azure API key
});

export const azure_gpt5 = createAzure({
  resourceName: 'makai-foundry-resource', // Azure resource name
  apiKey: process.env.AZURE_FOUNDRY_API_KEY, // Your Azure API key
})