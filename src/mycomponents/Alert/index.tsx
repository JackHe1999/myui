import React, { PureComponent, CSSProperties, Attributes, useState, useEffect, useRef } from 'react'
import icons from '../icons'
import { isRTL } from '../config'
import { alertClass } from './styles'
import { capitalize } from '../utils/strings'
import { defaultProps } from '../utils/defaultProps'

import { AlertProps } from './Props'

const DefaultProps = {
  ...defaultProps,
  iconSize: 16,
  duration: 200,
  type: 'warning',
}
interface State {
  dismiss: number
}

const Alert = (props: AlertProps) => {
  const [state, setState] = useState<State>({ dismiss: 0 });
  const elementRef = useRef<HTMLDivElement>(null);

  const dismiss = () => {
    const { onClose } = props;
    setState({ dismiss: 2 });
    if (typeof onClose === 'function') {
      onClose();
    }
  };

  const handleClose = () => {
    if (state.dismiss > 0) return;
    const { duration = DefaultProps.duration, outAnimation, onClose } = props;

    if (outAnimation) {
      if (typeof onClose === 'function') {
        onClose(duration, elementRef.current?.offsetHeight);
      }
      return;
    }

    if (duration > 0) {
      setState({ dismiss: 1 });
    } else {
      dismiss();
    }
  };

  useEffect(() => {
    const { duration = DefaultProps.duration, outAnimation, onClose } = props;
    if (duration > 0 && state.dismiss === 1) {
      setTimeout(dismiss, duration);
    }
  }, [state]);

  useEffect(() => {
    if (props.dismiss) {
      handleClose();
    }
  }, [props]);

  const renderIcon = () => {
    let { icon } = props;
    const { type = DefaultProps.type, iconSize = DefaultProps.iconSize } = props;

    if (typeof icon === 'boolean' && icon) {
      icon = icons[capitalize(type) as keyof typeof icons];
    }

    if (!icon) return null;
    const style: CSSProperties = { width: iconSize, height: iconSize, marginRight: iconSize / 2 };
    if (isRTL()) {
      style.marginLeft = style.marginRight;
      delete style.marginRight;
    }

    return (
      <div className={alertClass('icon')} style={style}>
        {icon}
      </div>
    );
  };

  const renderClose = () => {
    const { closeItem } = props;
    if (React.isValidElement(closeItem))
      return React.cloneElement(closeItem, { onClick: handleClose } as Attributes);
    return (
      <a className={alertClass('close')} onClick={handleClose}>
        {closeItem || icons.Close}
      </a>
    );
  };

  if (state.dismiss === 2) return null;

  const { children, className, type, onClose, outAnimation, hideClose } = props;
  const icon = renderIcon();

  const { style } = props;
  const showClose = onClose && !hideClose;
  let wrapClassName = alertClass(
    '_',
    type,
    !outAnimation && state.dismiss === 1 && 'dismissed',
    showClose && 'with-close',
    icon && 'with-icon',
    isRTL() && 'rtl'
  );
  if (className) wrapClassName += ` ${className}`;

  useEffect(() => {
    if (props.dismiss) {
      handleClose();
    }
  }, [props.dismiss]);

  return (
    <div ref={elementRef} className={wrapClassName} style={style}>
      {showClose && renderClose()}
      {icon}
      <div className={alertClass('content')}>{children}</div>
    </div>
  );
};

Alert.defaultProps = DefaultProps;
Alert.displayName = 'myuiAlert';

export default Alert;
