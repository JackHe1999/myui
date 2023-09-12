import React, { ComponentType, PureComponent } from 'react'
import createReactContext from '../context'
import { deepGet } from '../utils/objects'
import { isObject, isArray } from '../utils/is'
import { FormItemRule } from '../Rule/Props'
import { ObjectType } from '../@types/common'
import {
  FormContextKey,
  FormContextValue,
  FormProviderProps,
  GetFormConsumerProps,
  GetFormProviderProps,
} from './Props'
import { curry3 } from '../utils/func'

// 去掉独有的属性
const context = createReactContext<FormContextValue>({} as FormContextValue)

// eslint-disable-next-line
export const Provider = context.Provider
// eslint-disable-next-line
export const Consumer = context.Consumer

export const formProvider = <FormValue extends ObjectType, U extends FormProviderProps<FormValue>>(
  Origin: React.ComponentType<U>
): ComponentType<GetFormProviderProps<U, FormValue>> => {

  const FormProvider = (props: GetFormProviderProps<U, FormValue>) => {

    const combineRules = <ItemValue,>(name: string, propRules: FormItemRule<ItemValue>): FormItemRule<ItemValue> => {
      const { rules } = props;
      let newRules: FormItemRule<ItemValue> = [];
      if (isObject(rules) && name) {
        newRules = (deepGet(rules as ObjectType, name) || []) as FormItemRule<ItemValue>;
      } else if (isArray(rules)) {
        newRules = rules;
      }

      if (isArray(propRules)) {
        newRules = newRules.concat(propRules);
      }

      return newRules;
    };

    const {
      datum,
      labelAlign,
      labelVerticalAlign,
      labelWidth,
      disabled,
      pending,
      mode,
      size,
      keepErrorHeight,
    } = props;
    const value = {
      formDatum: datum,
      formMode: mode,
      disabled: !!(disabled || pending),
      labelAlign,
      labelVerticalAlign,
      labelWidth,
      size,
      combineRules,
      // groupValidate: groupValidate,
      keepErrorHeight,
    };

    return (
      <Provider value={value}>
        <Origin {...props} />
      </Provider>
    )
  };

  return FormProvider;
}

export interface FormConsumerProps {
  disabled?: boolean | ((...args: any) => boolean)
}

export const formConsumer = curry3(
  <U extends FormConsumerProps, Keys extends (keyof U) & FormContextKey>(
    keys: Keys[],
    Origin: ComponentType<U>,
    props: GetFormConsumerProps<U, Keys>
  ) => {
    const filterProps = (value?: ObjectType) => {
      const cps: ObjectType = {};
      if (!value) return cps;
      if (!keys) return value;

      keys.forEach(k => {
        const val = value[k];
        if (val !== undefined) cps[k] = val;
      });
      return cps;
    };

    return (
      <Consumer>
        {value => {
          const formProps = filterProps(value);
          return <Origin {...formProps as U} {...props} disabled={formProps.disabled || (props as any).disabled} />;
        }}
      </Consumer>
    );
  }
);