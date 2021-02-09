/*
 * Copyright 2019 IBM Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import Debug from 'debug'

import { WatchableJob } from '../core/jobs/job'
import { inBrowser } from '../core/capabilities'
import { cwd as kuiCwd } from '../util/home'
import { eventBus, StatusStripeChangeEvent } from '../core/events'

const debug = Debug('core/models/TabState')

interface TabStateConfig {
  maxWatchersPerTab?: number
}

let tabStateConfig: TabStateConfig
try {
  tabStateConfig = require('@kui-shell/client/config.d/limits.json')
} catch (err) {
  debug('using default TabStateConfig')
  tabStateConfig = {
    maxWatchersPerTab: 10
  }
}

/**
 * State that we want to keep per tab
 *
 */
export default class TabState {
  /** is the tab ready for command execution? */
  public ready = false

  /** is the tab closed? */
  public closed: boolean

  /** environment variables */
  private _env: Record<string, string>

  /** current working directory */
  private _cwd: string

  /** jobs attached to this tab */
  private _jobs: WatchableJob[]

  private _age: number[]

  private _ageCounter = 0

  /** is there a drilldown in progress for this tab? */
  public drilldownInProgress: Promise<void>

  // eslint-disable-next-line no-useless-constructor
  public constructor(
    public readonly uuid: string,
    private _desiredStatusStripeDecoration: StatusStripeChangeEvent = { type: 'default' },
    private _parent?: TabState
  ) {}

  public get env() {
    return this._env
  }

  public get cwd() {
    return this._cwd
  }

  /** Capture contextual global state */
  public capture() {
    this._env = Object.assign({}, process.env)
    this._cwd = kuiCwd()

    debug('captured tab state', this.uuid, this.cwd)
  }

  /** Clone the captured state */
  public cloneWithUUID(uuid: string) {
    this.capture()
    const clone = new TabState(uuid, this.desiredStatusStripeDecoration, this)
    clone._env = Object.assign({}, this.env)
    clone._cwd = this.cwd
    debug('cloned tab state', clone.uuid, clone.cwd)
    return clone
  }

  /**
   * @return the number of attached jobs
   */
  public get jobs(): number {
    return !this._jobs ? 0 : this._jobs.filter(_ => _ !== undefined).length
  }

  /** INTERNAL: abort the oldest job, and return the index of its slot */
  private abortOldestJob(): number {
    const oldestSlot = this._age.reduce((minAgeIdx, age, idx, ages) => {
      if (minAgeIdx === -1) {
        return idx
      } else if (ages[minAgeIdx] > age) {
        return idx
      } else {
        return minAgeIdx
      }
    }, -1)

    this._jobs[oldestSlot].abort()
    return oldestSlot
  }

  /** INTERNAL: find a free job slot, aborting the oldest job if necessary to free up a slot */
  private findFreeJobSlot(): number {
    const idx = this._jobs.findIndex(_ => _ === undefined)
    if (idx === -1) {
      return this.abortOldestJob()
    } else {
      return idx
    }
  }

  /** attach a job to this tab */
  public captureJob(job: WatchableJob) {
    if (!this._jobs) {
      const maxJobs = tabStateConfig.maxWatchersPerTab
      this._jobs = new Array<WatchableJob>(maxJobs)
      this._age = new Array<number>(maxJobs)
    }
    const slot = this.findFreeJobSlot()
    this._jobs[slot] = job
    this._age[slot] = this._ageCounter++
  }

  /**
   * Abort all jobs attached to this tab
   *
   */
  public abortAllJobs() {
    if (this._jobs) {
      this._jobs.forEach((job, idx) => {
        this.abortAt(idx)
      })
    }
  }

  /** INTERNAL: abort the job at the given index */
  private abortAt(idx: number) {
    this._jobs[idx].abort()
    this.clearAt(idx)
  }

  /** INTERNAL: clear the references to the job at the given index */
  private clearAt(idx: number) {
    this._jobs[idx] = undefined
    this._age[idx] = undefined
  }

  /** Enforce our desired status stripe decorations */
  public updateStatusStripe() {
    if (this._parent) {
      this._parent.updateStatusStripe()
    } else {
      eventBus.emitStatusStripeChangeRequest(this.desiredStatusStripeDecoration)
    }
  }

  public get desiredStatusStripeDecoration() {
    return this._desiredStatusStripeDecoration
  }

  public set desiredStatusStripeDecoration(decor: StatusStripeChangeEvent) {
    this._desiredStatusStripeDecoration = decor
    if (this._parent) {
      this._parent.desiredStatusStripeDecoration = decor
    } else {
      this.updateStatusStripe()
    }
  }

  /**
   * Restore tab state
   *
   */
  public restore() {
    debug('restoring state', this.cwd)
    process.env = this._env

    if (this._cwd !== undefined) {
      if (inBrowser() || process.env.VIRTUAL_CWD) {
        debug('changing cwd', process.env.PWD, this._cwd)
        process.env.PWD = this._cwd
      } else {
        debug('changing cwd', process.cwd(), this._cwd)
        process.chdir(this._cwd)
      }
    }

    this.updateStatusStripe()
  }
}
