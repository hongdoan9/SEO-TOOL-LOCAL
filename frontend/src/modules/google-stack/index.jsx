import { StackProvider } from './stack.context';
import GoogleStackView from './GoogleStackView';

export default function GoogleStackModule() {
  return (
    <StackProvider>
      <GoogleStackView />
    </StackProvider>
  );
}
