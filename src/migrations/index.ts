import * as migration_20261118_081812_initial from './20261118_081812_initial'

export const migrations = [
  {
    up: migration_20261118_081812_initial.up,
    down: migration_20261118_081812_initial.down,
    name: '20261118_081812_initial',
  },
]
