import React, { ComponentType, PureComponent, useEffect, useState } from 'react'
import classnames from 'classnames'
import immer from 'immer'
import createReactContext from '../context'
import { errorSubscribe, RESET_TOPIC } from '../Datum/types'
import { getGrid } from '../Grid/utils'
import { objectValues } from '../utils/objects'
import { formClass } from './styles'
import { ObjectType } from '../@types/common'
import { FormItemContextValue, GetFormItemConsumerProps, ItemProps } from './Props'

const { Provider, Consumer } = createReactContext<FormItemContextValue>({} as FormItemContextValue)

const Label = (props: { width?: number | string; children: React.ReactNode }) => {
  const { width, children } = props;
  if (children === undefined) return null;

  return (
    <div style={{ width }} className={formClass('label')}>
      {children}
    </div>
  );
}

interface ItemState {
  inputs: ObjectType<Boolean>
  errors: ObjectType<Error>
}

const Item = (props: ItemProps) => {
  let updateTimer: NodeJS.Timeout;
  const [state, setState] = useState<ItemState>({ inputs: {}, errors: {} });
  const [forceUpdateFlag, setForceUpdateFlag] = useState(false);

  const getErrors = () => {
    const { formDatum } = props;
    const errors: Error[] = [];

    if (formDatum) {
      Object.keys(state.inputs).forEach(name => {
        const err = formDatum.getError(name);
        if (err) errors.push(err);
      });
    }

    objectValues(state.errors).forEach(err => {
      if (err) errors.push(err);
    });

    return errors;
  };

  const handleUpdate = () => {
    if (updateTimer) clearTimeout(updateTimer);
    updateTimer = setTimeout(() => {
      setForceUpdateFlag(prev => !prev);
    });
  };

  const bind = (name: string) => {
    const names = Array.isArray(name) ? name : [name];
    const { formDatum } = props;
    if (formDatum) {
      names.forEach(n => {
        formDatum.subscribe(errorSubscribe(n), handleUpdate);
      });
    }

    setState(immer(state => {
      names.forEach(n => {
        state.inputs[n] = true;
      });
    }));
  };

  const unbind = (name: string) => {
    const names = Array.isArray(name) ? name : [name];
    const { formDatum } = props;
    if (formDatum) {
      names.forEach(n => {
        formDatum.unsubscribe(errorSubscribe(n));
      })
    }

    setState(immer(state => {
      names.forEach(n => {
        delete state.inputs[n];
      });
    }));
  };

  const handleError = (name: string, error: Error) => {
    setState(immer(state => {
      state.errors[name] = error;
    }));
  };

  const renderHelp = (errors: Error[]) => {
    const realErrors = errors.filter(e => e.message);
    if (realErrors.length > 0) {
      return (
        <div className={formClass('error')}>
          {realErrors.map((e, i) => (
            <div key={i}>{e.message}</div>
          ))}
        </div>
      );
    }

    const { tip } = props;
    if (!tip) return null;
    return <div className={formClass('tip')}>{tip}</div>;
  };

  useEffect(() => {
    if (props.formDatum) {
      props.formDatum.subscribe(RESET_TOPIC, handleUpdate);
    }
  }, []);

  const {
    children,
    grid,
    label,
    labelAlign,
    labelVerticalAlign,
    labelWidth,
    required,
    style,
    keepErrorHeight,
  } = props;

  const errors = getErrors();
  const className = classnames(
    getGrid(grid),
    formClass(
      'item',
      required && 'required',
      errors.length > 0 && 'invalid',
      labelVerticalAlign && `label-vertical-align-${labelVerticalAlign}`,
      keepErrorHeight && `item-keep-height`,
      ['top', 'right', 'left'].indexOf(labelAlign || '') >= 0 && `label-align-${labelAlign}`
    ),
    props.className
  );

  return (
    <Provider value={{
      bindInputToItem: bind.bind(null),
      unbindInputFromItem: unbind.bind(null),
      onItemError: handleError.bind(null),
    }}>
      <div className={className} style={style}>
        <Label width={labelWidth}>{label}</Label>
        <div className={formClass('control')}>
          {children}
          {renderHelp(errors)}
        </div>
      </div>
    </Provider>
  );
};

Item.defaultProps = {
  className: '',
  style: {},
  formItemErrors: [],
  keepErrorHeight: false,
};

export default Item;

export const itemConsumer = <U,>(Origin: ComponentType<U>): React.FC<GetFormItemConsumerProps<U>> => (props) => {
  return <Consumer>{events => <Origin {...props as U} {...events} />}</Consumer>
}