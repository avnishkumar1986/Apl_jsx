import { ImgHTMLAttributes } from 'react';

export default function AppLogoIcon({ className = '', alt = 'APL Apollo Steel Pipes', ...props }: ImgHTMLAttributes<HTMLImageElement>) {
    return <img src="/apl-apollo-logo-transparent.png" alt={alt} className={`object-contain ${className}`} {...props} />;
}
