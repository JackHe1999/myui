import React from 'react'
import MarkDown from '../MarkDown'
import navable from './index'

export default function(loader, examples) {
  const Component = () => <MarkDown {...this.props} loader={loader} examples={examples} />

  return navable(Component)
}
