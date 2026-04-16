import React from 'react';
import { SvgXml } from 'react-native-svg';

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500"><defs><style>.cls-1{fill:#ebebeb;}.cls-2{fill:#263238;}.cls-3{fill:#1d61e7;}.cls-4{fill:#fafafa;}.cls-5{fill:#ffc727;}.cls-6{fill:#455a64;}.cls-7{fill:#fff;}.cls-8{fill:#f5f5f5;}.cls-9{fill:#e0e0e0;}.cls-10{fill:#c7c7c7;}.cls-11{fill:#f79c8d;}.cls-12{fill:#f28f8f;}.cls-13{fill:#37474f;}.cls-14{fill:#ffa8a7;}.cls-15{fill:#a6a6a6;}.cls-16{fill:#d9dde2;}</style></defs><g id="Background_Complete" data-name="Background Complete"><rect class="cls-1" x="46" y="370.93" width="408" height="0.25"></rect><rect class="cls-1" x="400.8" y="384.82" width="21.2" height="0.25"></rect><rect class="cls-1" x="288.6" y="382.6" width="43.71" height="0.25"></rect><rect class="cls-1" x="351.82" y="378.48" width="34.93" height="0.25"></rect><rect class="cls-1" x="76.9" y="379.55" width="25.25" height="0.25"></rect><rect class="cls-1" x="110.9" y="379.55" width="44.53" height="0.25"></rect><rect class="cls-1" x="186.83" y="378.73" width="62.97" height="0.25"></rect><path class="cls-1" d="M206.81,286.93a5.68,5.68,0,0,0-5.16,1.73c-1.33,1.55-1.56,3.92-.76,5.78s2.59,3.21,4.47,4.07a14.92,14.92,0,0,0,14.53-1.22c1.26-.78,2.47-2,2.59-3.49s-1.09-2.92-2.53-3.58a9.52,9.52,0,0,0-4.17-.75A8.65,8.65,0,0,0,206.81,286.93Z"></path><path class="cls-1" d="M403.39,304.07a5,5,0,0,0-4.55,1.53c-1.18,1.38-1.38,3.51-.68,5.17s2.28,2.75,3.93,3.49a13.1,13.1,0,0,0,12.77-1c1.11-.67,2.17-1.74,2.27-3s-1-2.62-2.22-3.22a8.58,8.58,0,0,0-3.67-.68A7.92,7.92,0,0,0,403.39,304.07Z"></path><path class="cls-1" d="M100.39,300.07a5,5,0,0,0-4.55,1.53c-1.18,1.38-1.38,3.51-.68,5.17s2.28,2.75,3.93,3.49a13.1,13.1,0,0,0,12.77-1c1.11-.67,2.17-1.74,2.27-3s-1-2.62-2.22-3.22a8.58,8.58,0,0,0-3.67-.68A7.92,7.92,0,0,0,100.39,300.07Z"></path><path class="cls-1" d="M74.24,321.61a6.91,6.91,0,0,0-6.26,2.11c-1.62,1.91-1.89,4.86-.93,7.18s3.11,4,5.37,5.06a17.9,17.9,0,0,0,17.46-1.52c1.52-.97,3-2.45,3.13-4.29s-1.32-3.6-3.06-4.42a11.5,11.5,0,0,0-5-1A10.53,10.53,0,0,0,74.24,321.61Z"></path><path class="cls-1" d="M420.24,338.61a6.91,6.91,0,0,0-6.26,2.11c-1.62,1.91-1.89,4.86-.93,7.18s3.11,4,5.37,5.06a17.9,17.9,0,0,0,17.46-1.52c1.52-1,3-2.45,3.13-4.29s-1.32-3.6-3.06-4.42a11.5,11.5,0,0,0-5-1A10.53,10.53,0,0,0,420.24,338.61Z"></path>...<rect x="248.46" y="390.89" width="21.6" height="0.25" style="fill:#ebebeb"></rect><rect x="357.66" y="389.21" width="43.71" height="0.25" style="fill:#ebebeb"></rect></svg>`;

export default function WelcomeIllustration(props) {
  return (
    <SvgXml
      xml={svg}
      width={props.width || 260}
      height={props.height || 260}
    />
  );
}
