import React from 'react';

import SPELLS from 'common/SPELLS';
import makeWclUrl from 'common/makeWclUrl';
import SpellIcon from 'common/SpellIcon';
import { formatThousands, formatNumber } from 'common/format';

import LazyLoadStatisticBox from 'Main/LazyLoadStatisticBox';

import Module from 'Parser/Core/Module';

const POWER_WORD_BARRIER_REDUCTION = 0.25;

class PowerWordBarrier extends Module {
  get damageReducedDuringPowerWordBarrier() {
    return this.totalDamageTakenDuringPWB / (1 - POWER_WORD_BARRIER_REDUCTION) * POWER_WORD_BARRIER_REDUCTION;
  }

  get damageReduced() {
    return this.damageReducedDuringPowerWordBarrier;
  }

  totalDamageTakenDuringPWB = 0;

  load() {
    return fetch(makeWclUrl(`report/tables/damage-taken/${this.owner.report.code}`, {
      start: this.owner.fight.start_time,
      end: this.owner.fight.end_time,
      filter: `IN RANGE FROM type='applybuff' AND ability.id=${SPELLS.POWER_WORD_BARRIER_BUFF.id} TO type='removebuff' AND ability.id=${SPELLS.POWER_WORD_BARRIER_BUFF.id} GROUP BY target ON target END`,
    }))
      .then(response => response.json())
      .then(json => {
        if (json.status === 400 || json.status === 401) {
          throw json.error;
        } else {
          this.totalDamageTakenDuringPWB = json.entries.reduce((damageTaken, entry) => damageTaken + entry.total, 0);
        }
      });
  }

  statistic() {
    const fightDuration = this.owner.fightDuration;

    return (
      <LazyLoadStatisticBox
        loader={this.load.bind(this)}
        icon={<SpellIcon id={SPELLS.POWER_WORD_BARRIER_BUFF.id} />}
        value={`≈${formatNumber(this.damageReducedDuringPowerWordBarrier / fightDuration * 1000)} DRPS`}
        label="Barrier DRPS"
        tooltip={
          `The total Damage Reduced by Power Word: Barrier was ${formatThousands(this.damageReducedDuringPowerWordBarrier)} (${formatNumber(this.damageReducedDuringPowerWordBarrier / fightDuration * 1000)} per second average). This includes values from other priests in your raid due to technical limitations.`
        }
      />
    );
  }
}

export default PowerWordBarrier;
