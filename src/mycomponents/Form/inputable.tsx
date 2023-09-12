import React, { ComponentType, useEffect, useState } from 'react'
import immer from 'immer'
import { promiseAll, isSameError } from '../utils/errors'
import shallowEqual from '../utils/shallowEqual'
import { filterProps } from '../utils/objects'
import { getUidStr } from '../utils/uid'
import { isArray } from '../utils/is'
import validate from '../utils/validate'
import { FORCE_PASS, ERROR_TYPE, IGNORE_VALIDATE, errorSubscribe, IGNORE_BIND, ValidType } from '../Datum/types'
import { formConsumer } from './formContext'
import { itemConsumer } from './Item'
import { fieldSetConsumer } from './FieldSet'
import ListDatum from '../Datum/List'
import { ObjectType } from '../@types/common'
import { FormItemRule } from '../Rule/Props'
import { InputableProps, BaseInputProps, GetInputableProps, InputableFormConsumerKey } from './Props'

interface CustomValidateType {
  (...args: any): Promise<any>
}

const types: InputableFormConsumerKey[] = ['formDatum', 'disabled', 'combineRules', 'size']

const tryValue = (val: unknown, def: unknown) => (val === undefined ? def : val)

const beforeValueChange = <Value extends any>(fn: InputableProps<Value>['onChange']) => (
  value: InputableProps<Value>['value'],
  datum: InputableProps<Value>['formDatum']
) => {
  if (!fn) return value
  const newValue = fn(value, datum)
  return newValue === undefined ? value : newValue
}

interface InputableState<Value> {
  value?: Value
  error: any
}

export default <Value, U extends BaseInputProps, Item = any>(Origin: ComponentType<U>) => {
  const InputableInner = React.memo((props: InputableProps<Value>) => {
    let lastError: boolean | undefined;
    let errorChange: boolean;
    let datum: ListDatum<Item, Value> | undefined;
    let updateTimer: NodeJS.Timeout;
    let lastValue: Value | undefined = props.formDatum && props.name ? props.formDatum.get(props.name) || {} : {};
    let customValidate: CustomValidateType;

    const [state, setState] = useState<InputableState<Value>>({
      error: undefined,
      value: props.value || props.defaultValue
    });
    const [itemName, setItemName] = useState(getUidStr);
    const [errorName, setErrorName] = useState(Array.isArray(props.name) ? props.name.join('|') : props.name);
    const [forceUpdateFlag, setForceUpdateFlag] = useState(false);

    const getValue = () => {
      const { formDatum, name, value, defaultValue } = props
      if (formDatum && name) {
        if (Array.isArray(name)) {
          const dv = ((defaultValue || []) as unknown) as Value extends any[] ? Value : any[]
          return name.map((n, i) => tryValue(formDatum.get(n), dv[i]))
        }
        return tryValue(formDatum.get(name), defaultValue)
      }
      const hasValue = 'value' in props || 'checked' in props
      return !hasValue ? state.value : value
    };

    const getError = () => {
      const { formDatum, name, error } = props
      if ('error' in props) {
        return error
      }
      if (formDatum && name) {
        return formDatum.getError(errorName!)
      }

      return state.error
    };

    const handleDatumBind = (newDatum: ListDatum<Item, Value>) => {
      datum = newDatum;
    };

    const handleError = (error?: Error) => {
      const { formDatum, name, onItemError, onError } = props
      if (formDatum && name) {
        if (!isSameError(error, formDatum.getError(errorName!, true))) {
          formDatum.setError(errorName!, error, true)
        }
      } else {
        setState({ ...state, error })
      }

      const hasError = error !== undefined
      errorChange = hasError !== lastError
      lastError = hasError

      if (onError) onError(error)
      if (onItemError && !name) onItemError(itemName, error)
    };

    const validateHook = (newCustomValidate: CustomValidateType) => {
      customValidate = newCustomValidate;
    };

    function validateValue(type: unknown): Promise<any>
    function validateValue(value: any, data: ObjectType | undefined, type?: ValidType): Promise<any>
    function validateValue(value: any, data?: ObjectType, type?: ValidType) {
      const { name, formDatum, combineRules, bind } = props;
      const names = Array.isArray(name) ? name : [name];

      const validates = [];
      const validateProps = filterProps(props, v => typeof v === 'string' || typeof v === 'number');

      if (datum) {
        const datumValue = datum.formatValue(value);
        value = datum.limit === 1 ? datumValue[0] : datumValue;
        // @ts-ignore
        validateProps.type = 'array';
      }

      if (type === FORCE_PASS || value === FORCE_PASS) {
        handleError();
        return Promise.resolve(true);
      }

      if (value === undefined || Array.isArray(name)) value = getValue();
      if (!Array.isArray(name)) value = [value];
      if (customValidate) validates.push(customValidate());
      if (formDatum && bind && type !== IGNORE_BIND) {
        // console.error(new Error('Use "bind" props to combine validate is not recommend. Use Form "groups" props instead.'))
        formDatum.validateFields(bind, IGNORE_BIND).catch(() => { });
      }
      if (!data && formDatum) data = formDatum.getValue();

      let { rules } = props;
      names.forEach((n, i) => {
        if (formDatum && combineRules) {
          rules = combineRules(n!, rules);
        }

        if (isArray(rules) && rules.length > 0) {
          validates.push(validate(value[i], data!, rules, validateProps));
        }
      });

      return promiseAll(validates)
        .then((res: true | Error) => {
          handleError(res === true ? undefined : res)
          return res
        })
        .catch(e => {
          handleError(e)
          return e
        });
    }

    const handleChange = (value: Value | undefined, ...args: any) => {
      const { formDatum, name, fieldSetValidate, onChange, filterSameChange } = props
      const currentValue = getValue()
      if ((args.length === 0 || filterSameChange) && shallowEqual(value, currentValue)) {
        return
      }
      const beforeChange = beforeValueChange(props.beforeChange!)
      if (formDatum && name) {
        value = beforeChange(value, formDatum)
        formDatum.set(name, value)
        formDatum.removeFormError(errorName!)
      } else {
        value = beforeChange(value, undefined)
        setState({ ...state, value })
      }

      if (onChange) onChange(value, ...args)
      if (fieldSetValidate) fieldSetValidate(true)
    };

    useEffect(() => {
      if (state.value) {
        validateValue(state.value).catch(() => { })
      }
    }, [state.value]);

    const handleUpdate = (value: Value, sn: string, type?: typeof ERROR_TYPE | typeof FORCE_PASS | typeof IGNORE_VALIDATE) => {
      if (type === ERROR_TYPE) {
        if (!isSameError(value, state.error)) setState({ ...state, error: value })
        return
      }

      const { name, onChange, forceChangeOnValueSet } = props
      const newValue = !Array.isArray(name)
        ? value
        : (immer(getValue(), (draft: any) => {
          name.forEach((n, i) => {
            if (n === sn) draft[i] = value
          })
        }) as Value)

      if (!errorChange && shallowEqual(newValue, lastValue)) return
      lastValue = newValue

      if (type === FORCE_PASS) {
        handleError()
        setState({ ...state, error: undefined })
        setForceUpdateFlag(prev => !prev)
        return
      }

      if (onChange && forceChangeOnValueSet) onChange(newValue)

      if (type !== IGNORE_VALIDATE) {
        if (updateTimer) clearTimeout(updateTimer)
        updateTimer = setTimeout(() => {
          validateValue(newValue, undefined, type).catch(() => { })
        }, 0)
      }
      setForceUpdateFlag(prev => !prev)
    };

    useEffect(() => {
      // @ts-ignore
      const { readOnly } = props
      const { onChange, disabled } = props
      if ('value' in props && !onChange && disabled !== true && readOnly !== true) {
        console.error(
          'warning: You provided a `value` prop to a form field without an `onChange` handler. This will render a read-only field. If the field should be mutable use `defaultValue`. Otherwise, set either `onChange` or `readOnly` or `disabled`'
        )
      }
      const { formDatum, name, defaultValue, bindInputToItem, popover } = props

      if (formDatum && name) {
        if (Array.isArray(name)) {
          const dv = ((defaultValue || []) as unknown) as Value extends any[] ? Value : any[]

          name.forEach((n, i) => formDatum.bind(n, handleUpdate, dv[i], validateValue))

          // @ts-ignore
          state.value = name.map(n => formDatum.get(n))
          formDatum.subscribe(errorSubscribe(errorName!), handleUpdate)
        } else {
          formDatum.bind(name, handleUpdate, defaultValue, validateValue)
          // @ts-ignore
          state.value = formDatum.get(name)
        }
        lastValue = state.value
      }

      if (bindInputToItem && name && !popover) bindInputToItem(errorName!)

      return () => {
        const { formDatum, name, unbindInputFromItem, reserveAble } = props
        clearTimeout(updateTimer)
        if (formDatum && name) {
          formDatum.unbind(name, handleUpdate, reserveAble)
          if (Array.isArray(name)) {
            formDatum.unsubscribe(errorSubscribe(errorName!), handleUpdate)
            formDatum.setError(errorName!)
          }
        }
        if (unbindInputFromItem && name) unbindInputFromItem(errorName!)
      }
    }, []);

    const {
      formDatum,
      value,
      required,
      bind,
      onItemError,
      bindInputToItem,
      unbindInputFromItem,
      scuSkip = ['onChange', 'rules'],
      defaultValue,
      rules = [] as FormItemRule<Value>,
      reserveAble,
      ...other
    } = props

    return (
      <Origin
        {...other as any}
        formDatum={formDatum}
        error={getError()}
        value={getValue()}
        onChange={handleChange}
        onDatumBind={handleDatumBind}
        validateHook={validateHook}
      />
    )
  }, (prevProps, nextProps) => {
    const skip = [...(prevProps.scuSkip || []), 'formDatum']
    const isFormDatum = prevProps.formDatum && prevProps.name
    if (isFormDatum) skip.push('value')
    const options = { skip, deep: ['data', 'defaultValue', 'datum', 'name', 'rule', 'style'] }

    return !(shallowEqual(nextProps, prevProps, options))
  });

  const WithFiledSetConsumer = fieldSetConsumer(InputableInner)
  const WidthItemConsumer = itemConsumer(WithFiledSetConsumer)
  const WidthFormConsumer = formConsumer(types)(WidthItemConsumer)
  return WidthFormConsumer as ComponentType<GetInputableProps<U, Value>>
}