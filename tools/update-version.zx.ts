import { isNumber } from 'my-gadgetry/type-check'
import { $ } from 'zx'

const VERSION_MAP = {
  major: '$1',
  minor: '$2',
  patch: '$3',
  pre: '$4',
}

const PRE_VERSION = {
  prefix: '$1',
  num: '$2',
}

const run = async () => {
  const currentVersion = (await $`jq -r .version package.json`).stdout.trim()
  const versionMapStr = currentVersion.replace(/^(\d+)\.(\d+)\.(\d+)-?(.*)?$/, JSON.stringify(VERSION_MAP))
  const versionMap = JSON.parse(versionMapStr)
  const preVersionStr = versionMap.pre.replace(/^(\w+\.?)?(\w+)/, JSON.stringify(PRE_VERSION))
  if (preVersionStr) {
    const preVersionMap = JSON.parse(preVersionStr)
    if (isNumber(preVersionMap.num, true)) {
      versionMap.pre = `${preVersionMap.prefix}${parseInt(preVersionMap.num) + 1}`
    } else {
      versionMap.patch = parseInt(versionMap.patch) + 1
    }
  } else {
    versionMap.patch = parseInt(versionMap.patch) + 1
  }
  const nextVersion = Object.entries(versionMap).reduce((acc, [key, version]) => {
    if (!version) {
      return acc
    }
    if (key === 'pre') {
      acc += '-'
    } else if (key !== 'major') {
      acc += '.'
    }
    return `${acc}${version}`
  }, '')
  await $`sed -i 'package.json' -e 's/"version": "${currentVersion}"/"version": "${nextVersion}"/'`
}

run().then(version => {
  return version
})
