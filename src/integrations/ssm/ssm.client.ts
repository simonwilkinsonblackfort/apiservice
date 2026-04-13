import { SSMClient, GetParameterCommand, GetParametersByPathCommand } from '@aws-sdk/client-ssm'
import { config } from '../../config/index.js'

const client = new SSMClient({ region: config.AWS_REGION })

export async function getSSMParameter(name: string, decrypt = true): Promise<string | null> {
  try {
    const command = new GetParameterCommand({ Name: name, WithDecryption: decrypt })
    const result = await client.send(command)
    return result.Parameter?.Value ?? null
  } catch {
    return null
  }
}

export async function getSSMParametersByPath(path: string): Promise<Record<string, string>> {
  const params: Record<string, string> = {}
  let nextToken: string | undefined

  do {
    const command = new GetParametersByPathCommand({
      Path: path,
      WithDecryption: true,
      NextToken: nextToken,
    })
    const result = await client.send(command)

    for (const param of result.Parameters ?? []) {
      if (param.Name && param.Value) {
        const key = param.Name.replace(path, '').replace(/^\//, '')
        params[key] = param.Value
      }
    }

    nextToken = result.NextToken
  } while (nextToken)

  return params
}

// Load secrets from SSM and merge into process.env
export async function loadSecretsFromSSM(path: string) {
  const secrets = await getSSMParametersByPath(path)
  for (const [key, value] of Object.entries(secrets)) {
    if (!process.env[key]) {
      process.env[key] = value
    }
  }
}
