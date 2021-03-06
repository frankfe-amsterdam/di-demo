import { ChevronDown, ChevronUp } from '@datapunt/asc-assets';
import styled from '@datapunt/asc-core';
import { Heading, Icon, themeColor } from '@datapunt/asc-ui';
import React, { useState } from 'react';

const AcordeonContentStyle = styled.div`
  padding: 10px 20px 1px;

  h5 {
    font-size: 16px;
    font-weight: 700;
    margin-bottom: 0;
  }

  ::last-child {
    text-align: center;
  }
`;

export type Props = {
  open?: boolean;
};

const AcordeonStyle = styled.div<Props>`
  background-color: ${themeColor('tint', 'level2')};

  & > header {
    display: flex;
    align-items: center;
    cursor: pointer;
    height: 40px;
    padding: 0 20px;
    background-color: ${themeColor('tint', 'level2')};

    h5 {
      font-size: 15px;
      margin-bottom: 0;
      flex-grow: 1;
    }
  }
`;

export const Acordeon = ({ title, children }) => {
  const [open, setOpen] = useState(false);

  const toggleContent = event => {
    event.preventDefault();
    event.stopPropagation();
    setOpen(!open);
  };

  return (
    <AcordeonStyle open={open}>
      <>
        <header
          role="button"
          onClick={toggleContent}
          onKeyDown={() => {}}
          tabIndex={-1}
        >
          <Heading as="h5">
            {title}
            <Icon size={13}>{open ? <ChevronUp /> : <ChevronDown />}</Icon>
          </Heading>
        </header>
        {open && <AcordeonContentStyle>{children}</AcordeonContentStyle>}
      </>
    </AcordeonStyle>
  );
};
