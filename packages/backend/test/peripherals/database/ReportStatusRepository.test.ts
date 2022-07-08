import { Hash256, Logger, UnixTime } from '@l2beat/common'
import { expect } from 'earljs'

import { ReportStatusRepository } from '../../../src/peripherals/database/ReportStatusRepository'
import { setupDatabaseTestSuite } from './shared/setup'

describe(ReportStatusRepository.name, () => {
  const { database } = setupDatabaseTestSuite()
  const repository = new ReportStatusRepository(database, Logger.SILENT)

  beforeEach(async () => {
    await repository.deleteAll()
  })

  const HASH_ONE = Hash256.random()
  const HASH_TWO = Hash256.random()

  const TIME_ONE = UnixTime.now().toStartOf('hour')
  const TIME_TWO = TIME_ONE.add(-1, 'hours')
  const TIME_THREE = TIME_ONE.add(-2, 'hours')

  it('stores a single timestamp', async () => {
    await repository.add({ configHash: HASH_ONE, timestamp: TIME_ONE })

    const timestamps = await repository.getByConfigHash(HASH_ONE)
    expect(timestamps).toEqual([TIME_ONE])
  })

  it('stores many timestamps across many hashes, but only latest', async () => {
    await repository.add({ configHash: HASH_ONE, timestamp: TIME_ONE })
    await repository.add({ configHash: HASH_ONE, timestamp: TIME_TWO })
    await repository.add({ configHash: HASH_ONE, timestamp: TIME_THREE })
    await repository.add({ configHash: HASH_TWO, timestamp: TIME_ONE })
    await repository.add({ configHash: HASH_TWO, timestamp: TIME_TWO })

    const timestampsOne = await repository.getByConfigHash(HASH_ONE)
    expect(timestampsOne).toEqual([TIME_THREE])

    const timestampsTwo = await repository.getByConfigHash(HASH_TWO)
    expect(timestampsTwo.length).toEqual(2)
    expect(timestampsTwo).toBeAnArrayWith(TIME_ONE, TIME_TWO)
  })

  it('can add the same value multiple times ', async () => {
    await repository.add({ configHash: HASH_ONE, timestamp: TIME_ONE })
    await repository.add({ configHash: HASH_ONE, timestamp: TIME_ONE })
    await repository.add({ configHash: HASH_ONE, timestamp: TIME_ONE })

    const timestamps = await repository.getByConfigHash(HASH_ONE)
    expect(timestamps).toEqual([TIME_ONE])
  })
})
