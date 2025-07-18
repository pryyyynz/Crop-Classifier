import React from 'react';
import { Text, TextStyle } from 'react-native';
import { parseTextForRN } from '@/utils/theme';

interface FormattedTextProps {
    text: string;
    style?: TextStyle;
    boldStyle?: TextStyle;
}

export const FormattedText: React.FC<FormattedTextProps> = ({
    text,
    style = {},
    boldStyle = {}
}) => {
    const segments = parseTextForRN(text);

    return (
        <Text style={style}>
            {segments.map((segment, index) => (
                <Text
                    key={index}
                    style={segment.bold ? { ...style, fontWeight: 'bold', ...boldStyle } : style}
                >
                    {segment.text}
                </Text>
            ))}
        </Text>
    );
};