import React, { useEffect } from 'react'
import { curry } from '../utils/func'
import { capitalize } from '../utils/strings'
import { IGNORE_VALIDATE, WITH_OUT_DISPATCH } from './types'
import List from './List'
import Form from './Form'
import { ObjectType } from '../@types/common'
import { DatumBaseProps, DatumHocOptions, GetDatumProps } from './Props'

const types = {
  form: Form,
  list: List,
}

export default curry(<U extends DatumBaseProps>(options: DatumHocOptions<U>, Origin: React.ComponentType<U>) => {
  const { type = 'list', key = 'value', limit = 0, bindProps = [], ignoreUndefined, pure = true } = options || {}
  const Datum = types[type]

  const FcComponent = (props: GetDatumProps<U>) => {
    let thisDatum: ObjectType;
    let prevValues: any;

    const setValue = (t?: string) => {
      const values = props[key as keyof GetDatumProps<U>]
      if (ignoreUndefined && values === undefined) return
      thisDatum.setValue(values, t)
    };

    useEffect(() => {
      thisDatum.setLock(false)
      prevValues = props[key as keyof GetDatumProps<U>]
    }, []);

    useEffect(() => {
      thisDatum.setLock(false)
      thisDatum.onChange = props.onChange
    }, [props.onChange]);

    const { datum, onChange, initValidate = false } = props

    if (datum instanceof Datum) {
      thisDatum = datum
    } else {
      const ops = bindProps.reduce(
        (o: any, k) => {
          o[k] = props[k as keyof GetDatumProps<U>]
          return o
        },
        { limit, initValidate }
      )
      if (key in props) {
        ops[key] = props[key as keyof GetDatumProps<U>]
      }
      if (`default${capitalize(key)}` in props) {
        ops[`default${capitalize(key)}`] = props[`default${capitalize(key)}` as keyof GetDatumProps<U>]
      }
      thisDatum = new (Datum as any)(Object.assign(ops, datum))
    }

    if (onChange) {
      thisDatum.onChange = onChange
    }

    const { onDatumBind, ...otherProps } = props
    if (onDatumBind) onDatumBind(thisDatum)
    if (bindProps.includes('disabled')) {
      thisDatum.setDisabled(props.disabled)
    }
    const values = props[key as keyof GetDatumProps<U>]
    if (type === 'form' && values !== prevValues) {
      setValue(props.initValidate ? undefined : IGNORE_VALIDATE)
      thisDatum.setLock(true)
      prevValues = values
    }

    if (type === 'list') setValue(WITH_OUT_DISPATCH)
    // delete props[key]

    return <Origin {...otherProps as U} datum={thisDatum} />
  };

  return FcComponent;
})