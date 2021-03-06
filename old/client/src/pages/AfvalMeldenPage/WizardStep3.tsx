import React, { useContext, useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import AfvalMeldenContext from './AfvalMeldenContext';
import { ButtonStyleProps } from '../../shared/components/Button/ButtonStyle';
import Button from '../../shared/components/Button/Button';
import { createIrmaSession } from '../../services/di';

const loginButtonPosition: ButtonStyleProps = {
  width: 224,
  height: 65,
  top: 455,
  left: 15,
};

const detailButtonPosition: ButtonStyleProps = {
  width: 348,
  height: 130,
  top: 272,
  left: 6,
};

const homeButtonPosition: ButtonStyleProps = {
  width: 360,
  height: 112,
  top: 0,
  left: 0,
};

const WizardStep3: React.FC = () => {
  const { theme } = useParams();
  const { step, gotoStep } = useContext(AfvalMeldenContext);
  const [sending, setSending] = useState(false);

  const send = async (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setSending(true);
  };

  useEffect(() => {
    if (sending) {
      (async () => {
        await createIrmaSession('email', 'irma-qr');
        setSending(false);
        gotoStep(null, 4);
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sending]);

  return step === 3 ? (
    <>
      <img
        alt="Rommel Melden"
        src={`/assets/theme/${theme}/rommelmelden-step3.png`}
        height="1022" // ams 1188
        width="360"
        decoding="async"
      />
      <Button onClick={e => gotoStep(e, 1)} {...homeButtonPosition} />
      <Button onClick={e => gotoStep(e, 2)} {...detailButtonPosition} />
      <Button onClick={send} {...loginButtonPosition} />
      {sending && <div id="irma-qr" />}
    </>
  ) : null;
};

export default WizardStep3;
