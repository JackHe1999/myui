import React, { ComponentType, useRef, useState } from 'react'
import classnames from 'classnames'
import { Component } from '../component'
import { curry } from '../utils/func'
import { popoverClass } from '../Popover/styles'
import { buttonClass } from '../Button/styles'
import { inputClass } from '../Input/styles'
import { inputBorderClass } from '../Form/styles'
import Popover from '../Popover'
import { PopoverProps } from '../Popover/Props'
import { isRTL } from '../config'
import getDataset from '../utils/dom/getDataset'
import { InputBorderProps, GetInputBorderProps } from './Props'

interface Options {
  tag: 'label' | 'div' | 'span'
  isGroup?: boolean
  overflow?: string
  className?: ((props: { [name: string]: any }) => string) | string
  from?: string
  enterPress?: boolean
}

export default curry(
  <U extends InputBorderProps>(options: Options, Origin: React.ComponentType<U>) => {
    return (((props: InputBorderProps) => {
      const [focus, setFocus] = useState(props.autoFocus);
      const elRef = useRef<any>(null);

      const handleBlur = (event: React.FocusEvent<HTMLElement>) => {
        setFocus(false)
        const { onBlur } = props
        if (onBlur) onBlur(event)
      };

      const handleFocus = (event: React.FocusEvent<HTMLElement>) => {
        setFocus(false)
        const { onFocus } = props
        if (onFocus) onFocus(event)
      };

      const renderHelp = (focus?: boolean) => {
        const { error, tip, popover, popoverProps = {} as PopoverProps } = props
        const classList = ['input-tip']
        const position = popover || (isRTL() ? 'bottom-right' : 'bottom-left')

        const styles =
          popoverProps.style && popoverProps.style.width
            ? popoverProps.style
            : Object.assign({ minWidth: 200, maxWidth: 400 }, popoverProps.style || {})

        // 只有有错需要popover，或者tip被focus才显示
        if ((error && popover) || (tip && focus)) {
          if (error) classList.push('input-error')
          return (
            <Popover
              getPopupContainer={() => elRef.current}
              {...popoverProps}
              visible
              style={styles}
              className={popoverClass(...classList)}
              position={position}
            >
              {error ? error.message : tip}
            </Popover>
          )
        }
        return null
      };

      const {
        className,
        border = true,
        size,
        tip,
        popover,
        width,
        style = {},
        error,
        popoverProps = {},
        underline,
        ...other
      } = props

      const rtl = isRTL()

      const Tag = options.tag || 'label'

      const newStyle = Object.assign({ width }, style)
      const isDisabled = typeof other.disabled === 'function' ? false : !!other.disabled
      const newClassName = classnames(
        inputBorderClass(rtl && 'rtl'),
        inputClass(
          '_',
          rtl && 'rtl',
          focus && !isDisabled && 'focus',
          isDisabled && 'disabled',
          options.isGroup && 'group',
          size,
          newStyle.width && 'inline',
          !border && 'no-border',
          options.overflow && `overflow-${options.overflow}`,
          error && 'invalid',
          popover && error && 'focus',
          underline && 'underline'
        ),
        buttonClass(options.isGroup && 'group', options.from === 'input' && options.isGroup && 'from-input-group'),
        typeof options.className === 'function' ? options.className(props) : options.className,
        props.className
      )

      return (
        <Tag
          ref={elRef}
          className={newClassName}
          style={newStyle}
          tabIndex={options.enterPress ? 0 : undefined}
          {...getDataset(other)}
        >
          <Origin
            {...other as U}
            size={size}
            onFocus={handleFocus}
            onBlur={handleBlur}
            inputFocus={focus}
          />
          {renderHelp(focus)}
        </Tag>
      )
    }) as unknown) as ComponentType<GetInputBorderProps<U>>;
  }
)