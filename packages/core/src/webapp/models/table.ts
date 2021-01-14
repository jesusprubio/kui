/*
 * Copyright 2019-2020 IBM Corporation
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

/* eslint-disable @typescript-eslint/explicit-member-accessibility */

import { ReactElement } from 'react'
import { Breadcrumb } from '../../models/NavResponse'
import { MetadataBearing, MetadataNamedResource, Entity } from '../../models/entity'

export class Row {
  attributes?: Cell[]

  /** uniquely identifies this row in a given table; if not defined, we will use the name field as the row key */
  rowKey?: string

  /** optional associated metadata for the corresponding resource */
  object?: Pick<MetadataNamedResource, 'metadata'> & {
    spec?: {
      selector?: {
        matchLabels?: Record<string, string>
      }
    }
  }

  /** the key-value pair for the first column */
  key?: string
  name: string

  nameDom?: Element

  /** does this row represent a recently deleted resource? */
  isDeleted?: boolean

  type?: string

  packageName?: string

  prettyType?: string

  fontawesome?: string

  fontawesomeCSS?: string

  setSelected?: () => void

  setUnselected?: () => void

  nameCss?: string | string[]

  prettyName?: string

  fullName?: string

  kind?: string

  prettyKind?: string

  status?: string

  version?: string

  prettyVersion?: string

  beforeAttributes?: Cell[]

  rowCSS?: string | string[]

  onclickIdempotent?: boolean

  onclickExec?: 'pexec' | 'qexec'

  onclick?: any // eslint-disable-line @typescript-eslint/no-explicit-any

  css?: string

  outerCSS?: string

  done?: boolean

  constructor(row: Row) {
    Object.assign(this, row)
  }
}

export class Cell {
  value: string

  valueDom?: ReactElement

  css?: string

  outerCSS?: string

  onclick?: any // eslint-disable-line @typescript-eslint/no-explicit-any

  key?: string

  fontawesome?: string[] | string

  tag?: string

  tagClass?: string

  innerClassName?: string

  className?: string

  constructor(cell: Cell) {
    Object.assign(this, cell)
  }
}

export interface Button {
  name: string
  fontawesome: string
  balloon?: string
  onclick: (evt: Event) => void | string
}

export enum TableStyle {
  Light,
  Medium,
  Heavy
}

type PresentationStyle = 'table' | 'grid' | 'sequence-diagram' | 'timeline'

export class Table<RowType extends Row = Row> {
  body: RowType[]

  /** Markdown cells? */
  markdown?: boolean

  /** This field helps with watching/paginating */
  resourceVersion?: number | string

  /** Default presentation? */
  defaultPresentation?: PresentationStyle

  /** Allowed presentations? */
  allowedPresentations?: PresentationStyle[]

  /** Column index to be interpreted as a status column */
  statusColumnIdx?: number

  /** Column index to be interpreted as a duration column */
  durationColumnIdx?: number

  /** Column index to be interpreted as a time to initialize the computation */
  coldStartColumnIdx?: number

  /** Column index to be interpreted as a start timestamp column */
  startColumnIdx?: number

  /** Column index to be interpreted as a complete timestamp column */
  completeColumnIdx?: number

  /** Coloring strategy for e.g. 'grid' and 'sequence-diagram' */
  colorBy?: 'status' | 'duration'

  style?: TableStyle

  header?: RowType & { isSortable?: boolean }

  footer?: string[]

  noSort?: boolean

  title?: string
  breadcrumbs?: Breadcrumb[] | (() => Breadcrumb[])

  flexWrap?: number | boolean

  tableCSS?: string

  fontawesome?: string

  fontawesomeCSS?: string

  fontawesomeBalloon?: string

  constructor(table: Table) {
    Object.assign(this, table)
  }
}

export function isTableWithTimestamp(table: Table) {
  return table.startColumnIdx >= 0 && table.completeColumnIdx >= 0
}

export function isTable<C>(model: MetadataBearing<C> | Entity): model is Table {
  return (
    model !== undefined &&
    (model instanceof Table || ((model as Table).body !== undefined && Array.isArray((model as Table).body)))
  )
}

export class Icon {
  fontawesome: string

  onclick?: (evt: Event) => void

  balloon?: string

  balloonLength?: string

  balloonPos?: string

  constructor(icon: Icon) {
    Object.assign(this, icon)
  }
}
