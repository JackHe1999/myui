import create from './Container'
import * as events from './events'
import { TooltipType } from './Props'

const Tooltip: TooltipType = create(events)

Tooltip.displayName = 'myuiTooltip'

export default Tooltip