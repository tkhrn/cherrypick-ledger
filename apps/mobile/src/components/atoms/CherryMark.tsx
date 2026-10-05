import Svg, { Circle, Path } from 'react-native-svg';

// designs/brand/cherry-mark.svg 와 같은 도형. 마크를 바꾸면 둘 다 고친다.
export function CherryMark({ size = 72 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" accessibilityLabel="cherrypick">
      <Path d="M54 10 C51 24 40 35 30 43" stroke="#2F5D3A" strokeWidth={6} fill="none" strokeLinecap="round" />
      <Path d="M54 10 C58 25 66 35 72 43" stroke="#2F5D3A" strokeWidth={6} fill="none" strokeLinecap="round" />
      <Path d="M53 11 q14 -10 28 -2 q-13 11 -28 2z" fill="#3E7B4C" />
      <Circle cx={28} cy={66} r={24} fill="#F1E4D8" stroke="#DCC6B6" strokeWidth={2.5} />
      <Path d="M16 59 h24 M16 67.5 h16 M16 76 h20" stroke="#CDB4A1" strokeWidth={4.5} strokeLinecap="round" />
      <Circle cx={74} cy={66} r={24} fill="#C8364B" />
      <Circle cx={65} cy={55} r={5} fill="#FFFFFF" opacity={0.22} />
      <Path d="M62 66 l8 8 l14 -15" stroke="#FFFFFF" strokeWidth={7} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
