import React, { ReactNode, useState } from 'react'
import { SUBMIT_TOPIC } from '../Datum/types'
import { getUidStr } from '../utils/uid'
import { selectClass } from './styles'
import Result from './Result'
import OptionList from './OptionList'
import OptionTree from './OptionTree'
import BoxList from './BoxList'
import { isObject } from '../utils/is'
import { docSize } from '../utils/dom/document'
import { getParent } from '../utils/dom/element'
import { isRTL } from '../config'
import absoluteList from '../AnimationList/AbsoluteList'
import { getDirectionClass } from '../utils/classname'
import { RegularAttributes, ResultItem, UnMatchedValue } from '../@types/common'
import { BaseSelectProps, Control, WrappedBoxListComp, WrappedOptionListComp, WrappedOptionTreeComp } from './Props'

const WrappedOptionList = absoluteList(OptionList) as typeof WrappedOptionListComp
const WrappedBoxList = absoluteList(BoxList) as typeof WrappedBoxListComp
const WrappedOptionTree = absoluteList(OptionTree) as typeof WrappedOptionTreeComp

const isResult = (el: HTMLDivElement, selector?: string) => getParent(el, selector || `.${selectClass('result')}`)

const DefaultValue = {
  clearable: false,
  data: [],
  height: 250,
  itemsInView: 10,
  lineHeight: 34,
  loading: false,
  multiple: false,
  renderItem: (e: any) => e,
  text: {},
  compressed: false,
  trim: true,
  autoAdapt: false,
  showArrow: true,
  focusSelected: true,
}

interface SelectState {
  control: Control
  focus: boolean
  position: RegularAttributes.ListPosition
}

const Select = <Item, Value>(props: BaseSelectProps<Item, Value>) => {
  const [state, setState] = useState<SelectState>({
    control: 'mouse',
    focus: false,
    position: 'drop-down',
  });


};

Select.defaultProps = DefaultValue;

export default Select;