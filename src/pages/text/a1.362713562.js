import React, { useState } from 'react';
import * as R from 'ramda';

import Layout from '../../components/layout';
import { useInterval, randInt, randBool } from '../../util';

const A1362713562 = 'A1.362713562';
const SYMBOLS = '╜φ°⌂▌╫§╜';

const FLUME_MIXTAPE_VIDEO_URL = 'https://youtu.be/7TML_MTQdg4?t=206';

const A1362713562Component = () => {
  const [value, setValue] = useState('');
  const [headerText, setHeaderText] = useState(A1362713562);

  useInterval(
    () => {
      // Only modify the header 20% of the time
      if (Math.random() > 0.2) {
        return;
      }

      // Swap out a random character of the header title with a random character from one of the
      // two source strings
      const index = randInt(0, headerText.length);
      const char = randBool()
        ? SYMBOLS[randInt(0, SYMBOLS.length)]
        : A1362713562[randInt(0, A1362713562.length)];
      const lens = R.lensIndex(index);

      const newHeaderText = R.set(lens, char, headerText);
      setHeaderText(newHeaderText);
    },
    21,
    [headerText, setHeaderText]
  );

  if (value.toUpperCase() === A1362713562) {
    window.location.replace(FLUME_MIXTAPE_VIDEO_URL);
  }

  return (
    <Layout>
      <h1 style={{ fontFamily: '"Oxygen Mono", "Hack", monospace' }}>
        {headerText}
      </h1>
      <input
        type="text"
        value={value}
        onChange={(evt) => setValue(evt.target.value)}
      />
      <i>300 ZEDEX</i>
    </Layout>
  );
};

export default A1362713562Component;
