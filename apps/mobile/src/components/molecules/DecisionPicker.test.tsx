import { fireEvent, render, screen } from '@testing-library/react-native';
import { DecisionPicker } from './DecisionPicker';

describe('DecisionPicker', () => {
  it('reports the chosen decision', async () => {
    const onChange = jest.fn();
    await render(<DecisionPicker value="pending" onChange={onChange} />);
    await fireEvent.press(screen.getByText('모임장부'));
    expect(onChange).toHaveBeenCalledWith('group');
  });

  it('marks the current decision as selected', async () => {
    await render(<DecisionPicker value="mine" onChange={jest.fn()} />);
    expect(screen.getByRole('radio', { name: '내 소비' }).props.accessibilityState).toEqual({ selected: true });
  });
});
