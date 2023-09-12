import React, { useEffect, useState } from 'react'
import immer from 'immer'
import Datum from '../Datum/Tree'
import { curry } from '../utils/func'
import { mergeFilteredTree } from '../utils/tree'
import { treeClass } from '../Tree/styles'
import { treeSelectClass } from './styles'
import {
  TreeSelectPropsWithTied,
  TreeSelectPropsWithFilter,
  FilterFormType,
  TreeSelectPropsWithAdvancedFilter,
} from './Props'

interface TiledState {
  tileds: string[]
}
const DefaultProps = {
  childrenKey: 'children',
}

export default curry((options, Origin) => {
  const { dataKey = 'data' } = options
  const Tiled = <Item, Value>(props: TreeSelectPropsWithTied<Item, Value>) => {
    const [state, setState] = useState<TiledState>({ tileds: [] });
    const [forceUpdateFlag, setForceUpdateFlag] = useState<boolean>(false);
    let filteredDatum: Datum<Item>;
    let rawDatum: any;

    const getFilteredDatum = () => {
      const { keygen, childrenKey } = props
      const data = props[dataKey as 'data']
      if (filteredDatum && filteredDatum.data === data) return filteredDatum
      filteredDatum = new Datum({
        data,
        keygen,
        childrenKey: childrenKey || DefaultProps.childrenKey,
      })
      return filteredDatum
    };

    const getIcon = (data: Item) => {
      const { childrenKey = 'children', expanded = [] } = props
      const originIcon = <span className={treeClass('default-icon')} />
      const key = rawDatum.getKey(data)
      const rawData = rawDatum.getDataById(key)
      if (!data || !rawData) return originIcon
      const sameCount =
        data[childrenKey as keyof Item] &&
        rawData[childrenKey] &&
        ((data[childrenKey as keyof Item] as unknown) as Item[]).length === rawData[childrenKey].length
      if (expanded.indexOf(key) === -1) return originIcon
      return (
        <span className={treeSelectClass('match', sameCount && 'full')} onClick={handleToggle.bind(null, key)}>
          <span />
        </span>
      )
    };

    const handleFilter = (text: string, from: FilterFormType) => {
      const { onFilter } = props
      if (!text) setState({ tileds: [] })
      if (onFilter) onFilter(text, from)
    };

    const handleToggle = (key: string, e: React.MouseEvent) => {
      e.stopPropagation()
      setState(
        immer(draft => {
          const index = draft.tileds.indexOf(key)
          if (index >= 0) draft.tileds.splice(index, 1)
          else draft.tileds.push(key)
        })
      )
    };

    const genRawDatum = () => {
      const { rawData, childrenKey = DefaultProps.childrenKey, keygen } = props
      rawDatum = new Datum({ data: rawData, childrenKey, keygen: keygen as any })
    };

    // useEffect(() => {
    //   if (props.onAdvancedFilter) genRawDatum()
    // }, []);

    useEffect(() => {
      if (props.onAdvancedFilter) {
        if (rawDatum) rawDatum.setData(props.rawData)
        else genRawDatum()
        setForceUpdateFlag(prev => !prev)
      }
    }, [props]);

    const { filterText, onAdvancedFilter } = props
    const { tileds } = state
    if (!filterText || !onAdvancedFilter) return <Origin {...props} />
    const expandIcons = [getIcon, getIcon]
    const filterDatum = getFilteredDatum()
    const data = mergeFilteredTree(filterDatum as any, rawDatum, tileds)
    const newProps = {
      ...props,
      onFilter: handleFilter,
      expandIcons,
      [dataKey]: data,
    }
    return <Origin {...newProps} />
  };
});

export const advancedFilterHOC = <Item, Value>(Origin: React.ComponentType<TreeSelectPropsWithFilter<Item, Value>>) => (
  props: TreeSelectPropsWithAdvancedFilter<Item, Value>
) => {
  const { onAdvancedFilter, onFilter } = props
  return <Origin {...props as any} onFilter={onAdvancedFilter || onFilter} onAdvancedFilter={!!onAdvancedFilter} />
};