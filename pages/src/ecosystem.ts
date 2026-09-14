import 'reflect-metadata'
import { existsSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { create, createFileRegistry, setExtension } from '@bufbuild/protobuf'
import {
  FieldDescriptorProto_Label,
  FieldDescriptorProto_Type,
  FileDescriptorProtoSchema,
} from '@bufbuild/protobuf/wkt'
import { createValidator } from '@bufbuild/protovalidate'
import { Validator as CfworkerValidator } from '@cfworker/json-schema'
import { is as deepkitIs, ReflectionKind, type Type, uuidAnnotation } from '@deepkit/type'
import { validator as schemasafe } from '@exodus/schemasafe'
import { ParseUUIDPipe } from '@nestjs/common'
import { s } from '@sapphire/shapeshift'
import { Value as ElysiaValue } from '@sinclair/typebox/value'
import Ajv from 'ajv'
import addFormats from 'ajv-formats'
import { type } from 'arktype'
import { UUID as BsonUuid } from 'bson'
import { uuid as decodersUuid } from 'decoders'
import { Schema as EffectSchema } from 'effect'
import { Schema as Effect4Schema } from 'effect-4'
import { t as elysia } from 'elysia'
import FastestValidator from 'fastest-validator'
import { UUIDResolver } from 'graphql-scalars'
import id128 from 'id128'
import { UUID as IoTsUuid } from 'io-ts-types'
import isUuid from 'is-uuid'
import Joi from 'joi'
import { Validator as JsonSchemaValidator } from 'jsonschema'
import { compileSchema } from 'json-schema-library'
import * as S from 'sury'
import { Type as TypeBox } from 'typebox'
import { Value as TypeBoxValue } from 'typebox/value'
import { _isFormatUuid } from 'typia/lib/internal/_isFormatUuid'
import * as realUuid from 'uuid'
import { UUID as Uuidv7 } from 'uuidv7'
import * as v from 'valibot'
import validator from 'validator'
import * as yup from 'yup'
import ZSchema from 'z-schema'
import { z } from 'zod'
import { z as z3 } from 'zod/v3'

/**
 * Why a validator accepts a value that is not a UUID. All but `legacy` are intended; `legacy` is a
 * flaw the library's newer major has since fixed. Validators without a reason simply do not read
 * the version or variant.
 */
export type Reason = 'jsonSchema' | 'guid' | 'loose' | 'bytes' | 'legacy'

export interface EcosystemValidator {
  /** The npm package, as shown on the page. */
  pkg: string
  /** The dependency name to read the installed version from, when it differs from `pkg`. */
  dependency?: string
  /** The function or rule being called. */
  fn: string
  check: (value: string) => boolean | Promise<boolean>
  reason?: Reason
}

const accepts =
  (run: (value: string) => unknown) =>
  async (value: string): Promise<boolean> => {
    try {
      await run(value)
      return true
    } catch {
      return false
    }
  }

const arkUuid = type('string.uuid')
const fastestUuid = new FastestValidator().compile({ value: { type: 'uuid' } })

const ajv = new Ajv()
addFormats(ajv)
const ajvUuid = ajv.compile({ type: 'string', format: 'uuid' })
const jsonSchemaUuid = { type: 'string', format: 'uuid' } as const
const schemasafeUuid = schemasafe(jsonSchemaUuid)
const cfworkerUuid = new CfworkerValidator(jsonSchemaUuid)
const jsonschemaValidator = new JsonSchemaValidator()
const zSchema = ZSchema.create()
const jslUuid = compileSchema({
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  ...jsonSchemaUuid,
})
const typeboxUuid = TypeBox.String({ format: 'uuid' })
const elysiaUuid = elysia.String({ format: 'uuid' })
const effectUuid = EffectSchema.is(EffectSchema.UUID)
const effect4Uuid = Effect4Schema.is(Effect4Schema.String.check(Effect4Schema.isUUID()))
const nestPipe = new ParseUUIDPipe()

// Deepkit normally reads `UUID` through its compiler; this is the same type, built by hand.
const deepkitUuid: Type = { kind: ReflectionKind.string, annotations: {} }
uuidAnnotation.register(deepkitUuid.annotations!, true)

// protovalidate normally works on generated code, so the message that carries the rule is built here
// instead. The descriptor of validate.proto ships inside the package but is not exported.
const protovalidateUuid = await (async () => {
  const require = createRequire(import.meta.url)
  const root = path.dirname(path.dirname(require.resolve('@bufbuild/protovalidate')))
  const rules = await import(
    pathToFileURL(path.join(root, 'esm/gen/buf/validate/validate_pb.js')).href
  )
  const file = create(FileDescriptorProtoSchema, {
    name: 'uustupid.proto',
    package: 'uustupid',
    syntax: 'proto3',
    dependency: ['buf/validate/validate.proto'],
    messageType: [
      {
        name: 'Probe',
        field: [
          {
            name: 'id',
            jsonName: 'id',
            number: 1,
            type: FieldDescriptorProto_Type.STRING,
            label: FieldDescriptorProto_Label.OPTIONAL,
            options: {},
          },
        ],
      },
    ],
  })
  setExtension(
    file.messageType[0].field[0].options!,
    rules.field,
    create(rules.FieldRulesSchema, {
      type: { case: 'string', value: { wellKnown: { case: 'uuid', value: true } } },
    }),
  )
  const registry = createFileRegistry(file, (name) =>
    name === 'buf/validate/validate.proto' ? rules.file_buf_validate_validate : undefined,
  )
  const probe = registry.getMessage('uustupid.Probe')!
  const protovalidate = createValidator()
  return (id: string) => protovalidate.validate(probe, create(probe, { id })).kind === 'valid'
})()

/** Run at build time only. None of these libraries reach the browser. */
export const validators: EcosystemValidator[] = [
  { pkg: 'uuid', fn: 'validate()', check: (value) => realUuid.validate(value) },
  { pkg: 'validator', fn: 'isUUID()', check: (value) => validator.isUUID(value) },
  { pkg: 'is-uuid', fn: 'anyNonNil()', check: (value) => isUuid.anyNonNil(value) },
  { pkg: 'zod', fn: 'z.uuid()', check: (value) => z.uuid().safeParse(value).success },
  { pkg: 'yup', fn: 'string().uuid()', check: (value) => yup.string().uuid().isValidSync(value) },
  { pkg: 'arktype', fn: 'string.uuid', check: (value) => !(arkUuid(value) instanceof type.errors) },
  { pkg: 'fastest-validator', fn: 'uuid', check: (value) => fastestUuid({ value }) === true },
  {
    pkg: '@sapphire/shapeshift',
    fn: 's.string().uuid()',
    check: (value) => s.string().uuid().run(value).isOk(),
  },
  {
    pkg: 'effect',
    dependency: 'effect-4',
    fn: 'Schema.isUUID()',
    check: (value) => effect4Uuid(value),
  },

  {
    pkg: 'valibot',
    fn: 'v.uuid()',
    check: (value) => v.safeParse(v.pipe(v.string(), v.uuid()), value).success,
  },
  { pkg: 'decoders', fn: 'uuid', check: (value) => decodersUuid.decode(value).ok },
  {
    pkg: '@nestjs/common',
    fn: 'new ParseUUIDPipe()',
    check: accepts((value) => nestPipe.transform(value, { type: 'param' })),
  },
  { pkg: 'io-ts-types', fn: 'UUID', check: (value) => IoTsUuid.is(value) },
  {
    pkg: '@deepkit/type',
    fn: 'UUID',
    check: (value) => deepkitIs(value, undefined, undefined, deepkitUuid),
  },
  { pkg: '@bufbuild/protovalidate', fn: 'string.uuid', check: protovalidateUuid },

  {
    pkg: 'joi',
    fn: 'string().uuid()',
    check: (value) => !Joi.string().uuid().validate(value).error,
    reason: 'guid',
  },
  {
    pkg: 'graphql-scalars',
    fn: 'UUID',
    check: accepts((value) => UUIDResolver.coerceInputValue(value)),
    reason: 'guid',
  },
  {
    pkg: 'validator',
    fn: "isUUID(value, 'loose')",
    check: (value) => validator.isUUID(value, 'loose'),
    reason: 'loose',
  },
  {
    pkg: 'zod',
    fn: 'z.guid()',
    check: (value) => z.guid().safeParse(value).success,
    reason: 'loose',
  },

  {
    pkg: 'ajv-formats',
    fn: 'format: "uuid"',
    check: (value) => ajvUuid(value),
    reason: 'jsonSchema',
  },
  {
    pkg: '@exodus/schemasafe',
    fn: 'format: "uuid"',
    check: (value) => schemasafeUuid(value),
    reason: 'jsonSchema',
  },
  {
    pkg: '@cfworker/json-schema',
    fn: 'format: "uuid"',
    check: (value) => cfworkerUuid.validate(value).valid,
    reason: 'jsonSchema',
  },
  {
    pkg: 'jsonschema',
    fn: 'format: "uuid"',
    check: (value) => jsonschemaValidator.validate(value, jsonSchemaUuid).valid,
    reason: 'jsonSchema',
  },
  {
    pkg: 'z-schema',
    fn: 'format: "uuid"',
    check: (value) => zSchema.validate(value, jsonSchemaUuid) === true,
    reason: 'jsonSchema',
  },
  {
    pkg: 'json-schema-library',
    fn: 'format: "uuid"',
    check: (value) => jslUuid.validate(value).valid,
    reason: 'jsonSchema',
  },
  {
    pkg: 'typebox',
    fn: 'format: "uuid"',
    check: (value) => TypeBoxValue.Check(typeboxUuid, value),
    reason: 'jsonSchema',
  },
  {
    pkg: 'elysia',
    fn: 't.String({ format: "uuid" })',
    check: (value) => ElysiaValue.Check(elysiaUuid, value),
    reason: 'jsonSchema',
  },
  {
    pkg: 'typia',
    fn: 'tags.Format<"uuid">',
    check: (value) => _isFormatUuid(value),
    reason: 'jsonSchema',
  },
  {
    pkg: 'sury',
    fn: 'S.uuid',
    check: accepts((value) => S.parseOrThrow(value, S.uuid)),
    reason: 'jsonSchema',
  },

  { pkg: 'bson', fn: 'UUID.isValid()', check: (value) => BsonUuid.isValid(value), reason: 'bytes' },
  {
    pkg: 'id128',
    fn: 'Uuid.isCanonical()',
    check: (value) => id128.Uuid.isCanonical(value),
    reason: 'bytes',
  },
  {
    pkg: 'uuidv7',
    fn: 'UUID.parse()',
    check: accepts((value) => Uuidv7.parse(value)),
    reason: 'bytes',
  },

  {
    pkg: 'zod',
    fn: "z.string().uuid() from 'zod/v3'",
    check: (value) => z3.string().uuid().safeParse(value).success,
    reason: 'legacy',
  },
  { pkg: 'effect', fn: 'Schema.UUID', check: (value) => effectUuid(value), reason: 'legacy' },
]

/** How many uustupids and how many real UUIDs every validator is given. */
export const SAMPLE_SIZE = 100

export interface Verdict {
  pkg: string
  version: string
  fn: string
  reason?: Reason
  /** Out of `total`: uustupids the validator called a UUID. Expected to be 0. */
  oursWrong: number
  /** Out of `total`: real UUIDs the validator rejected. Expected to be 0. */
  realWrong: number
  total: number
}

/** The installed version of a direct dependency, read from its own package.json. */
export function installedVersion(dependency: string, from = process.cwd()): string {
  for (let dir = path.resolve(from); ; dir = path.dirname(dir)) {
    const manifest = path.join(dir, 'node_modules', dependency, 'package.json')
    if (existsSync(manifest)) return JSON.parse(readFileSync(manifest, 'utf8')).version
    if (path.dirname(dir) === dir) return '?'
  }
}

/** Whether a validator accepts a value. A validator that throws has not accepted it. */
async function accepted(check: EcosystemValidator['check'], value: string): Promise<boolean> {
  try {
    return (await check(value)) === true
  } catch {
    return false
  }
}

/**
 * Feed every validator the same samples and count its wrong answers. A library that changes its
 * behavior changes these numbers; it never throws, so it cannot fail the build.
 */
export async function judge(
  ours: readonly string[],
  real: readonly string[],
  list: readonly EcosystemValidator[] = validators,
): Promise<Verdict[]> {
  const count = async (
    check: EcosystemValidator['check'],
    values: readonly string[],
    expected: boolean,
  ) => {
    let wrong = 0
    for (const value of values) if ((await accepted(check, value)) !== expected) wrong++
    return wrong
  }
  return Promise.all(
    list.map(async ({ pkg, dependency, fn, check, reason }) => ({
      pkg,
      version: installedVersion(dependency ?? pkg),
      fn,
      reason,
      oursWrong: await count(check, ours, false),
      realWrong: await count(check, real, true),
      total: Math.max(ours.length, real.length),
    })),
  )
}
