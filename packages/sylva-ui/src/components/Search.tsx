import { SearchIcon } from '../icons';
import TextField, { type TextFieldProps } from './TextField';

export type SearchProps = TextFieldProps;

/** A `TextField` with a magnifying glass, `type="search"` and autocomplete off. */
export default function Search(props: SearchProps) {
    return (
        <TextField
            type="search"
            autoComplete="off"
            leading={<SearchIcon size={18} />}
            {...props}
        />
    );
}
