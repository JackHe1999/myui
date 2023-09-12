import React, { useCallback, useEffect, useState } from 'react'
import immer from 'immer'
import Alert from '../Alert'
import { messageClass } from './styles'
import { getUidStr } from '../utils/uid'
import { MessageProps } from './Props'

type Message = {
  id: string
  type: 'success' | 'info' | 'warning' | 'danger'
  content: React.ReactNode
  dismiss: boolean
  h: number
  title: string
  top: number
  className: string
  position: string
  hideClose: boolean
  onClose: () => void
};
interface MessageState {
  messages: Message[]
};

const Container = (props: MessageProps) => {
  const [state, setState] = useState<MessageState>({ messages: [] });

  const handleClassName: (position: string | undefined, closeMsg: boolean) => string = (position = 'top', closeMsg) =>
    messageClass('item', `item-${closeMsg ? 'dismissed' : 'show'}-${position}`);

  const handleStyle: (closeMsg: boolean, h: number, position?: string) => React.CSSProperties | null = (closeMsg, h, position) => {
    if (!closeMsg || !h) {
      return null;
    }
    let styles = {};
    switch (position) {
      case 'bottom-right':
      case 'bottom-left':
        break;
      default:
        styles = {
          zIndex: -1,
          opacity: 0,
          marginTop: -h,
        };
        break;
    }

    return styles;
  };

  const addMessage = (msg: { duration: number }) => {
    const id = getUidStr();
    setState(immer((state: any) => {
      state.messages.push(Object.assign({ id }, msg));
    }));

    if (msg.duration > 0) {
      setTimeout(() => {
        setState(immer(state => {
          state.messages.forEach((m: Message) => {
            if (m.id === id) {
              m.dismiss = true;
            }
          });
        }))
      }, msg.duration * 1000);
    }

    // return closeMessageForAnimation.bind(null, id, 200, 200);
  };

  const removeMessage = (id: string) => {
    let callback;
    const messages = state.messages.filter(m => {
      if (m.id !== id) return true;
      if (m.onClose) {
        callback = m.onClose;
      }
      return false;
    })

    if (messages.length === 0) {
      props.onDestory();
    } else {
      setState({ messages });
    }

    if (callback) (callback as Function)();
  };

  const closeMessageForAnimation = (id: string, duration?: number, msgHeight?: number) => {
    if (!duration) {
      removeMessage(id);
      return;
    }

    // duration animation duration time
    setState(immer(state => {
      state.messages.forEach((m: Message) => {
        if (m.id === id) {
          m.dismiss = true;
          m.h = (msgHeight || 0) + 20; // messageHeight + messageMargin
        }
      })
    }));
    setTimeout(() => {
      removeMessage(id);
    }, duration);
  };

  const closeEvent = (id: string, duration: number) => {
    if (duration === 0) {
      return removeMessage.bind(null, id);
    }

    return undefined;
  };

  useEffect(() => {
    addMessage(props.msg);
  }, [])

  return (
    <>
      {state.messages.map(({ id, type, content, dismiss, h, title, top, className, position, hideClose }) => (
        <div
          key={id}
          className={`${handleClassName(position, dismiss)} ${className}`}
          style={handleStyle(dismiss, h, position)!}
        >
          <Alert
            outAnimation
            className={messageClass('msg')}
            dismiss={dismiss}
            hideClose={hideClose}
            onClose={closeMessageForAnimation.bind(null, id)}
            icon
            iconSize={title ? 20 : 14}
            style={{ top }}
            type={type}
          >
            {title && <h3>{title}</h3>}
            {content}
          </Alert>
        </div>
      ))}
    </>
  );

};

Container.displayName = 'myuiMessage';

export default Container;