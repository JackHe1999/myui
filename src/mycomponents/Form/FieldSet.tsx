import React, { useEffect, useState } from 'react'
import createReactContext from '../context'
import { filterProps } from '../utils/objects'
import validate from '../utils/validate'
import { wrapFormError, FormError, isSameError } from '../utils/errors'
import { ERROR_TYPE, FORCE_PASS, IGNORE_VALIDATE } from '../Datum/types'
import FieldError from './FieldError'
import { FieldSetProviderValueType, FieldSetProps, GetFieldSetConsumerProps } from './Props'

const { Provider, Consumer } = createReactContext<FieldSetProviderValueType | undefined>(undefined)

function extendName(path: string | undefined, name: string): string
function extendName(path: string | undefined, name: undefined): undefined
function extendName(path: string | undefined, name: string[]): string[]

function extendName(path: string = '', name: string | undefined | string[]): string | string[] | undefined {
  if (name === undefined) return undefined
  if (name === '') return path
  if (Array.isArray(name)) {
    return name.map(n => extendName(path, n))
  }
  return `${path}${path.length > 0 ? '.' : ''}${name}`
}

const FieldSet = <Value extends any[]>(props: FieldSetProps<Value>) => {
  let updateTimer: NodeJS.Timeout;
  const [forceUpdateFlag, setForceUpdateFlag] = useState(false);

  const validateValue = (): Promise<FormError | true> => {
    const { formDatum, name } = props;
    const value = formDatum.get(name);
    const data = formDatum.getValue();
    const validateProps = filterProps(props, v => typeof v === 'string' || typeof v === 'number');
    // @ts-ignore
    validateProps.type = 'array';
    let rules = [...(props.rules || [])];
    rules = rules.concat(formDatum.getRule(name));

    if (rules.length === 0) return Promise.resolve(true);

    return validate(value, data, rules, validateProps).then(() => {
      handleError();
      return true;
    }, (e: any) => {
      handleError(e);
      return wrapFormError(e);
    });
  };

  const updateWithValidate = () => {
    validateValue().then(() => {
      setForceUpdateFlag(prev => !prev);
    })
  };

  const handleError = (error?: Error) => {
    const { formDatum, name, onError } = props;
    if (isSameError(error, formDatum.getError(name, true))) return;
    formDatum.setError(name, error, true);
    if (onError) onError(error);
  };

  const handleUpdate = (_v: any, _n: any, type?: typeof ERROR_TYPE | typeof FORCE_PASS | typeof IGNORE_VALIDATE) => {
    if(updateTimer) clearTimeout(updateTimer);
    updateTimer = setTimeout(() => {
      if(type === ERROR_TYPE || type === FORCE_PASS || type === IGNORE_VALIDATE){
        setForceUpdateFlag(prev => !prev);
      }else{
        updateWithValidate();
      }
    });
  };

  const handleInsert = (index: number, value: Value) => {
    const {formDatum, name} = props;
    formDatum.insert(name, index, value);
    updateWithValidate();
  };

  const handleRemove = (index: number) => {
    const {formDatum, name} = props;
    formDatum.splice(name, index);
    updateWithValidate();
  };

  const handleChange = (index: number, value: Value, update?: boolean) => {
    const {formDatum, name} = props;
    formDatum.set(`${name}[${index}]`, value);
    if(update) updateWithValidate();
  };

  useEffect(() => {
    const { formDatum, name, defaultValue } = props;
    formDatum.bind(name, handleUpdate, defaultValue, validateValue);

    return () => {
      formDatum.unbind(name, handleUpdate);
    }
  }, []);

  const { children, formDatum, name, empty, defaultValue } = props;

  const errors = formDatum.getError(name);
  const result = [];

  if(typeof children !== 'function'){
    return (
      <Provider value={{path: name, val: validateValue}}>
        {children}
        {errors instanceof Error && <FieldError key="error" error={errors}/>}
      </Provider>
    )
  }

  let values = formDatum.get(name) || defaultValue || [];
  if(values && !Array.isArray(values)) values = [values];
  if(values.length === 0 && empty){
    result.push(empty(handleInsert.bind(null, 0)));
  }else{
    const errorList = (Array.isArray(errors) ? errors : [errors]).filter(Boolean);
    values.forEach((v: Value[number], i: number) => {
      result.push(
        <Provider key={i} value={{path: `${name}[${i}]`, val: validateValue}}>
          {children({
            list: values,
            value: v,
            index: i,
            error: errorList,
            datum: formDatum,
            onChange: handleChange.bind(null, i),
            onInsert: handleInsert.bind(null, i),
            onAppend: handleInsert.bind(this, i + 1),
            onRemove: handleRemove.bind(null, i),
          })}
        </Provider>
      )
    });
  }

  if(errors instanceof Error){
    result.push(<FieldError key="error" error={errors} />);
  }

  return result;

};

FieldSet.defaultProps = {
  rules: [],
}

export const fieldSetConsumer = <U extends {name?: string | string[]}>(
  Origin: React.ComponentType<U>
): React.FC<GetFieldSetConsumerProps<U>> => props => (
  <Consumer>
    {({path, val} = {}) => (
      <Origin
        {...props as U}
        name={extendName(path, props.name as any)}
        innerFormNamePath={path}
        fieldSetValidate={val}
      />
    )}
  </Consumer>
)

export const FieldSetProvider = Provider;

export default fieldSetConsumer(FieldSet);