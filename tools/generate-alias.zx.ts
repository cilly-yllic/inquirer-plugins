import { resolve, join } from 'path'

import { getAliases, writePackageJson } from 'my-gadgetry/dev-ops/package-generator/generate-alias'

import { name } from 'package.json'

const AUTHOR_NAME = `@cilly`
const PACKAGE_NAME = name
const ROOT_PATH = resolve()
const SRC_DIR = 'src'
const OUTPUT_DIR = 'dist'

const aliases = getAliases(join(ROOT_PATH, SRC_DIR), ['^_internal'])
writePackageJson(ROOT_PATH, AUTHOR_NAME, PACKAGE_NAME, OUTPUT_DIR, aliases, 'modules')
