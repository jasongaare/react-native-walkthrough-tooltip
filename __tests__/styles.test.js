import styles from '../src/styles';

describe('testing styling', () => {
  it('shows stylesheet is as expected', () => {
    expect(styles).toMatchSnapshot();
  });
});
