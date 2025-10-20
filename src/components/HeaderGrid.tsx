import { ymd } from "../utils/Date";
import { CELL_W } from "../constants";

export default function HeaderGrid({ days }: {days: Date[] }) {

    const todayIdx = days.findIndex(dt => ymd(dt) === ymd(new Date()));

    return (
        <div className="adsolute inert-0">

            {/* 終末帯 */}
            {days.map((dt, i) => (dt.getDay()===0 || dt.getDay()===6) ? (
                <div key={i} className="absolute inset-y-0 bg-slate-100/60" style={{ left: i * CELL_W, width: CELL_W}} />
            ): null)}

            {/* 今日列 */}
            {todayIdx >= 0 && (
                <div className="absolute inset-y-o bg-blue-200" style={{ left: todayIdx *  CELL_W, width: CELL_W}} />
            )}

            {/* 縦ライン */}
            <div className="grid h-full" style={{ gridTemplateColumns: `repeat(${days.length}, ${CELL_W}px)` }}>
                {days.map((_, i) => <div key={i} className="border-l border-slate-200/70" />)}
            </div>

        </div>
    )

}