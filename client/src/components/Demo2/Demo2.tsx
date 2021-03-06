import React, { useState, useMemo, useEffect, useReducer } from 'react';
import createIrmaSession from '@services/createIrmaSession';
import getGGW from '@services/getGGW';
import content, { insertInPlaceholders } from '@services/content';
import ReactMarkDown from 'react-markdown';
import * as AscLocal from '@components/LocalAsc/LocalAsc';
import { Link, Accordion } from '@amsterdam/asc-ui';
import { Alert as AlertIcon } from '@amsterdam/asc-assets';
import CredentialSelector, { CredentialSource } from '@components/CredentialSelector/CredentialSelector';
import PageTemplate from '@components/PageTemplate/PageTemplate';
import BreadCrumbs from '@components/BreadCrumbs';
import QRCode from '@components/QRCode/QRCode';
import DemoNotification from '@components/DemoNotification/DemoNotification';
import ExternalLink from '@components/ExternalLink/ExternalLink';
import HeaderImage, { IHeaderImageProps } from '@components/HeaderImage/HeaderImage';
import EmphasisBlock from '@components/EmphasisBlock/EmphasisBlock';
import { Checkmark } from '@amsterdam/asc-assets';
import ContentBlock from '@components/ContentBlock/ContentBlock';
import WhyIRMA from '@components/WhyIRMA/WhyIRMA';
import preloadDemoImages from '@services/preloadImages';
import { startSurvey as startUsabillaSurvey } from '@services/usabilla';

export interface IProps {}

interface IState {
    hasResult?: boolean;
    hasError?: boolean;
    isOver18?: null | boolean;
    wijk?: string;
    ggw?: string;
    code?: string;
}

const initialState: IState = {
    hasResult: false,
    hasError: false,
    isOver18: null,
    wijk: '',
    ggw: '',
    code: ''
};

function reducer(state, newState) {
    return { ...state, ...newState };
}

const Demo2: React.FC<IProps> = () => {
    const [credentialSource, setCredentialSource] = useState(CredentialSource.PRODUCTION);
    const [state, dispatch] = useReducer(reducer, initialState);

    const getSession = async () => {
        const response = await createIrmaSession(
            'demo2',
            'irma-qr',
            credentialSource === CredentialSource.DEMO && { demo: true }
        );
        const newState: IState = { ...initialState };
        if (response) {
            const postcode = response['zipcode'].replace(/ /, '');
            newState.hasResult = true;
            newState.hasError = false;

            const ggwResponse = await getGGW(postcode);

            newState.isOver18 =
                response['over18'] === 'Yes' ||
                response['over18'] === 'yes' ||
                response['over18'] === 'Ja' ||
                response['over18'] === 'ja';

            if (ggwResponse) {
                newState.wijk = ggwResponse.buurtcombinatieNamen;
                newState.code = ggwResponse.ggwCode;
                newState.ggw = ggwResponse.ggwNaam;
            }
        } else {
            newState.hasError = true;
        }

        dispatch(newState);
        window.scrollTo(0, 0);
        startUsabillaSurvey();
        return response;
    };

    const { hasResult, hasError, isOver18, wijk, ggw, code } = state;

    // Preload demo images
    useEffect(() => {
        // Note that we're not preloading all the 'wijk'-photos
        preloadDemoImages(
            Object.keys(content.responsiveImages.demo2).map(key => content.responsiveImages.demo2[key].src)
        );
    }, []);

    // Define dynamic header image
    const headerImg = useMemo((): IHeaderImageProps => {
        if (!hasResult) {
            return {
                filename: content.responsiveImages.demo2.header.src,
                alt: content.responsiveImages.demo2.header.alt
            };
        } else if (wijk.length) {
            return {
                filename: code ? `wijken/${code}` : content.responsiveImages.demo2.headerWithAmsterdam.src,
                alt: code
                    ? insertInPlaceholders(content.responsiveImages.demo2.headerWithWijk.alt, ggw)
                    : content.responsiveImages.demo2.headerWithAmsterdam.alt
            };
        } else if (isOver18) {
            return {
                filename: content.responsiveImages.demo2.postcodeNegative.src,
                alt: content.responsiveImages.demo2.postcodeNegative.alt
            };
        } else if (!isOver18) {
            return {
                filename: content.responsiveImages.demo2.ageAndPostcodeNegative.src,
                alt: content.responsiveImages.demo2.ageAndPostcodeNegative.alt
            };
        }
    }, [hasResult, wijk, code, ggw, isOver18]);

    const resultAlert: JSX.Element = useMemo(() => {
        if (!hasResult && !hasError) {
            return null;
        } else if (hasError) {
            return (
                <AscLocal.Alert
                    color={AscLocal.AlertColor.ERROR}
                    icon={<AlertIcon />}
                    iconSize={22}
                    heading={content.demoErrorAlert.heading}
                    content={content.demoErrorAlert.content}
                    dataTestId="hasErrorAlert"
                />
            );
        } else if (isOver18 && wijk.length) {
            return (
                <AscLocal.Alert
                    color={AscLocal.AlertColor.SUCCESS}
                    icon={<Checkmark />}
                    iconSize={14}
                    heading={content.demo2.proven.alert.title}
                    content={insertInPlaceholders(content.demo2.proven.alert.bodyAgeAndPostcodePositive, wijk)}
                    dataTestId="hasResultAlert"
                />
            );
        } else if (!isOver18 && wijk.length) {
            return (
                <AscLocal.Alert
                    color={AscLocal.AlertColor.ERROR}
                    icon={<AlertIcon />}
                    iconSize={22}
                    heading={content.demo2.proven.alert.title}
                    content={insertInPlaceholders(content.demo2.proven.alert.bodyAgeNegative, wijk)}
                    dataTestId="hasResultAlert"
                />
            );
        } else if (isOver18 && !wijk.length) {
            return (
                <AscLocal.Alert
                    color={AscLocal.AlertColor.ERROR}
                    icon={<AlertIcon />}
                    iconSize={22}
                    heading={content.demo2.proven.alert.title}
                    content={content.demo2.proven.alert.bodyPostcodeNegative}
                    dataTestId="hasResultAlert"
                />
            );
        } else if (!isOver18 && !wijk.length) {
            return (
                <AscLocal.Alert
                    color={AscLocal.AlertColor.ERROR}
                    icon={<AlertIcon />}
                    iconSize={22}
                    heading={content.demo2.proven.alert.title}
                    content={content.demo2.proven.alert.bodyAgeAndPostcodeNegative}
                    dataTestId="hasResultAlert"
                />
            );
        }
    }, [hasResult, hasError, isOver18, wijk]);

    return (
        <PageTemplate>
            <ContentBlock>
                <CredentialSelector credentialSource={credentialSource} setCredentialSource={setCredentialSource} />
                {!hasResult && <DemoNotification />}
                <ReactMarkDown
                    source={content.demo2.breadcrumbs}
                    renderers={{ list: BreadCrumbs, listItem: BreadCrumbs.Item }}
                />
                <ReactMarkDown
                    source={content.demo2[hasResult ? 'proven' : 'unproven'].title}
                    renderers={{ heading: AscLocal.H1 }}
                />
                {resultAlert}
            </ContentBlock>
            <HeaderImage filename={headerImg.filename} alt={headerImg.alt} />
            {!hasResult ? (
                <AscLocal.Row noMargin>
                    <AscLocal.Column
                        span={{
                            small: 1,
                            medium: 2,
                            big: 6,
                            large: 9,
                            xLarge: 9
                        }}
                    >
                        <ContentBlock>
                            <ReactMarkDown
                                source={content.demo2.intro}
                                renderers={{
                                    heading: AscLocal.H3,
                                    list: AscLocal.UL
                                }}
                            />
                            <AscLocal.AccordionContainer>
                                <Accordion title={content.demo2.why.title}>
                                    <ReactMarkDown
                                        source={content.demo2.why.body}
                                        renderers={{
                                            paragraph: AscLocal.Paragraph,
                                            heading: AscLocal.AccordionHeading
                                        }}
                                    />
                                </Accordion>
                            </AscLocal.AccordionContainer>
                            <QRCode getSession={getSession} label={content.demo2.button} />
                            <ReactMarkDown
                                source={content.downloadIrma}
                                renderers={{
                                    paragraph: AscLocal.Paragraph,
                                    link: ExternalLink
                                }}
                            />
                        </ContentBlock>
                    </AscLocal.Column>
                    <AscLocal.Column
                        span={{
                            small: 1,
                            medium: 2,
                            big: 6,
                            large: 3,
                            xLarge: 3
                        }}
                    >
                        <WhyIRMA />
                    </AscLocal.Column>
                </AscLocal.Row>
            ) : (
                <>
                    <ContentBlock>
                        <ReactMarkDown source={content.noSavePromise} />
                    </ContentBlock>
                    <EmphasisBlock>
                        <ContentBlock>
                            <ReactMarkDown
                                source={content.demo2.result}
                                renderers={{
                                    heading: AscLocal.H3,
                                    paragraph: AscLocal.Paragraph,
                                    list: AscLocal.UL,
                                    link: Link
                                }}
                            />
                        </ContentBlock>
                    </EmphasisBlock>
                    <ContentBlock>
                        <ReactMarkDown
                            source={content.callToAction}
                            renderers={{
                                heading: AscLocal.H3,
                                paragraph: AscLocal.Paragraph,
                                list: AscLocal.UL,
                                link: AscLocal.InlineLink
                            }}
                        />
                    </ContentBlock>
                </>
            )}
        </PageTemplate>
    );
};

export default Demo2;
