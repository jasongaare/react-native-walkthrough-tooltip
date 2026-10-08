import React from 'react';
import { Modal } from 'react-native';
import Tooltip from 'react-native-walkthrough-tooltip';
import { colors, radius } from './theme';

// Android runs edge-to-edge (forced from Expo SDK 54), so `measure()` reports
// coordinates from the top of the screen — but a default Modal starts below
// the status bar. That pushes the lifted child and its bubble down by the
// status bar's height and leaves both system bars uncovered by the scrim.
// Drawing the Modal edge-to-edge as well puts both in the same coordinate
// space. iOS ignores these props.
const EdgeToEdgeModal = props => (
  <Modal {...props} statusBarTranslucent navigationBarTranslucent />
);

/** The library's Tooltip with this app's defaults applied. */
export default function Tip({ children, ...props }) {
  return (
    <Tooltip
      modalComponent={EdgeToEdgeModal}
      backgroundColor={colors.scrim}
      // The library lifts the real child over the scrim unchanged, so a dark
      // element would read as dark-on-dark. Ring it instead. This has to be an
      // outline, not a border: the wrapper is sized exactly to the measured
      // child, so a border would eat into it and squash the lifted copy.
      childrenWrapperStyle={{
        outlineWidth: 2,
        outlineOffset: 3,
        outlineColor: colors.live,
        outlineStyle: 'solid',
      }}
      contentStyle={{
        backgroundColor: colors.ink,
        borderRadius: radius,
        padding: 0,
      }}
      {...props}
    >
      {children}
    </Tooltip>
  );
}
