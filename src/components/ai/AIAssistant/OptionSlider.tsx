import { Slider } from '@/components/ui/slider';
import { Text } from '@/components/ui/typography';

interface OptionSliderProps {
  label: string;
  value: number;
  onValueChange: (value: number) => void;
  /** Optional scale labels shown beneath the slider (3 strings: low / mid / high) */
  scaleLabels?: [string, string, string];
  max?: number;
  min?: number;
  step?: number;
}

/**
 * Three-step labeled option slider used in AIAssistant advanced options.
 *
 * Encapsulates the `<Text>` + `<Slider>` + 3-label scale pattern that
 * appeared twice (识别精度 / 关键内容优先级).
 */
export function OptionSlider({
  label,
  value,
  onValueChange,
  scaleLabels,
  max = 100,
  min = 0,
  step = 1,
}: OptionSliderProps) {
  const handleChange = (v: number | number[]) => {
    onValueChange(Array.isArray(v) ? v[0] : v);
  };

  return (
    <div className="optionItem">
      <Text>{label}</Text>
      <Slider value={value} onValueChange={handleChange} max={max} min={min} step={step} />
      {scaleLabels && (
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{scaleLabels[0]}</span>
          <span>{scaleLabels[1]}</span>
          <span>{scaleLabels[2]}</span>
        </div>
      )}
    </div>
  );
}
