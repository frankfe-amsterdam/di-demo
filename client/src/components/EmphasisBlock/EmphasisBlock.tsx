import styled from 'styled-components';
import { themeColor, themeSpacing, breakpoint } from '@amsterdam/asc-ui';

export default styled.div`
    background-color: ${themeColor('tint', 'level2')};
    margin: 0 -240px ${themeSpacing(3)} -220px;
    padding: ${themeSpacing(4)} 240px ${themeSpacing(4)} 220px;

    /* // TODO: Check if this grey background needs to be shown on big screens */
    /* @media ${breakpoint('min-width', 'tabletM')} {
        background-color: transparent;
        padding: 0;
        margin: 0;
    } */
`;
