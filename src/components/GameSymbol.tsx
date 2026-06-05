import { Canvas, Circle, Group, Line, vec} from '@shopify/react-native-skia'; 
import { colors } from '../theme'; 

interface Props {
    value: 1 | 2; 
    size: number;
}

// native sun/moon renderer
export function GameSymbol({ value , size }: Props) {
    const cx = size / 2; 
    const cy = size / 2; 
    const r = size * 0.3; 

    if (value == 1) {
        const rays = []; 
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI / 4) * i; 
            const inner = r * 1.25; 
            const outer = r * 1.7; 
            rays.push(
                    <Line
                    key={i}
                    p1={vec(cx + Math.cos(angle) * inner, cy + Math.sin(angle) * inner)}
                    p2={vec(cx + Math.cos(angle) * outer, cy + Math.sin(angle) * outer)}
                    color={colors.sunRay}
                    style="stroke"
                    strokeWidth={size * 0.05}
                    strokeCap="round" 
                />
            );
        }
        return (
            <Canvas style={{ width: size, height: size}}>
                <Group>
                    {rays}
                    <Circle cx={cx} cy={cy} r={r} color={colors.sun} />
                </Group>
            </Canvas>
        );
    }

    return (
        <Canvas style={{ width: size, height: size}}>
            <Group layer>
                <Circle cx={cx} cy={cy} r={r} color={colors.moon} />
                <Circle cx={cx + r * 0.5} cy={cy - r * 0.3} r={r * 1.05} blendMode="clear" />
            </Group>
        </Canvas>
    )
}