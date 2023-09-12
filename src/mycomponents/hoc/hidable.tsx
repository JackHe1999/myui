import React, { ComponentType, useEffect, useState } from 'react'
import classnames from 'classnames'
import createReactContext from '../context'
import { getUidStr } from '../utils/uid'
import { hidableClass } from './styles'
import { GetHidableConsumerProps } from './Props'
import { ListAnimationType } from '../AnimationList/Props'

const context = createReactContext<{ visible?: boolean }>({});

export const consumer = <U extends {}>(
  Origin: React.ComponentType<U>
): React.FC<GetHidableConsumerProps<U>> => props => (
  <context.Consumer>{value => <Origin {...value} {...props} />}</context.Consumer>
);

interface HidableProps {
  show?: boolean
  className?: string
}

interface HidableConfig {
  type: ListAnimationType[]
  duration: number
  display?: string
}

export default function <U extends HidableProps>(
  Component: React.ComponentType<U>,
  { type = ['fade'], duration = 360, display = 'block' }: HidableConfig
) {
  const hasCollapse = type.indexOf('collapse') >= 0;
  const needTransform = type.indexOf('scale-y') >= 0;

  const Hidable: React.FC<U> = (props) => {
    const {show = false, className = ''} = props;
    const [isShow, setIsShow] = useState(props.show);
    let height: number = 0;
    const [id] = useState(`__hidable_${getUidStr()}__`);

    const getElement = () => {
      return document.querySelector(`.${id}`) as HTMLElement;
    };

    const doShow = () => {
      const es = getElement().style;
      es.display = display;
      setTimeout(() => {
        setIsShow(true);

        if (hasCollapse) {
          es.height = `${height}px`;

          setTimeout(() => {
            es.height = 'auto';
            es.overflow = '';
          }, duration);
        }
      }, 10);
    };

    const doHide = () => {
      setIsShow(false);
      const element = getElement();

      if (hasCollapse) {
        height = element.offsetHeight;
        element.style.height = `${height}px`;
        element.style.overflow = 'hidden';

        setTimeout(() => {
          element.style.height = '0px';
        }, 10);
      }

      setTimeout(() => {
        if (isShow === false && element) {
          element.style.display = 'none';
        }
      }, duration);
    };

    useEffect(() => {
      const el = getElement();
      if (!el) return;

      if (props.show) {
        doShow();
        return;
      }
      if (hasCollapse) height = el.offsetHeight;

      el.style.display = 'none';
      if (hasCollapse) {
        el.style.overflow = 'hidden';
        el.style.height = '0px';
      }
    }, []);

    useEffect(() => {
      if (props.show) {
        doShow();
      } else {
        doHide();
      }
    }, [props.show]);

    let animation = `animation-${duration}`;
    if (!needTransform) {
      animation = `fade-${animation}`;
    }
    const newClassName = classnames(
      hidableClass('_', ...type, animation, isShow && 'show'),
      className,
      id
    );
    const provider = { visible: isShow };

    return (
      <context.Provider value={provider}>
        <Component {...props} className={newClassName} />
      </context.Provider>
    );
  };

  return (Hidable as unknown) as ComponentType<U>;
}

