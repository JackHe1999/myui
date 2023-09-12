import React, { useEffect, useState } from 'react'
import Popover from './Panel'
import Button from '../Button'
import Alert from '../Alert'
import { popoverClass } from './styles'
import { getLocale } from '../locale'
import { PopoverConfirmProps } from './Props'

interface ConfirmState {
  ok: boolean
  cancel: boolean
}

const DefaultProps: any = {
  type: 'confirmwarning',
  icon: true,
  okType: 'danger',
}

const Confirm = (props: PopoverConfirmProps) => {
  const [state, setState] = useState<ConfirmState>({
    ok: false,
    cancel: false
  });
  let callback: Promise<any> | void;
  let closeFn: Function;

  const handleClick = (type: 'cancel' | 'ok', close: Function) => {
    const { onOk, onCancel } = props
    const fn = type === 'ok' ? onOk : onCancel
    if (fn) callback = fn()
    closeFn = close
    if (callback && typeof callback.then === 'function') {
      setState({ ...state, [type]: true })
    } else {
      close()
    }
  };

  useEffect(() => {
    if(state.ok){
      (callback as Promise<any>).then(() => {
        closeFn()
        setState({ ...state, ok: false })
      })
    }
    if(state.cancel){
      (callback as Promise<any>).then(() => {
        closeFn()
        setState({ ...state, cancel: false })
      })
    }
  }, [state]);

  const { children, type = 'confirmwarning', text, onOk, okType = 'danger', onCancel, icon = true, ...other } = props
  const { ok, cancel } = state
  return (
    <Popover {...other} trigger="click">
      {close => (
        <div className={popoverClass('confirm')}>
          <div className={popoverClass('mention')}>
            <Alert type={type} icon={icon} className={popoverClass('alert')}>
              {children}
            </Alert>
          </div>

          <div className={popoverClass('footer')}>
            <Button loading={cancel} size="small" onClick={() => handleClick('cancel', close)}>
              {getLocale('cancel', text)}
            </Button>
            <Button loading={ok} size="small" type={okType} onClick={() => handleClick('ok', close)}>
              {getLocale('ok', text)}
            </Button>
          </div>
        </div>
      )}
    </Popover>
  )
};

export default Confirm;