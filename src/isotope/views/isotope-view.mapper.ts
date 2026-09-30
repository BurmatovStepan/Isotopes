import { IsotopeDTO } from '../dto/display-isotope.dto.js';
import { IsotopeView } from './isotope.view.js';

const MINIO_URL = 'http://localhost:9000/isotopes';
const NANOSECONDS_PER_SECOND = 1000000000n;
const SECONDS_PER_YEAR = 31556952n;

const TIME_UNITS = [
    { label: 'млрд. л.', nanoseconds: SECONDS_PER_YEAR * 1000000000n * NANOSECONDS_PER_SECOND },
    { label: 'млн. л.', nanoseconds: SECONDS_PER_YEAR * 1000000n * NANOSECONDS_PER_SECOND },
    { label: 'тыс. л.', nanoseconds: SECONDS_PER_YEAR * 1000n * NANOSECONDS_PER_SECOND },
    { label: 'л.', nanoseconds: SECONDS_PER_YEAR * NANOSECONDS_PER_SECOND },
    { label: 'д.', nanoseconds: 86400n * NANOSECONDS_PER_SECOND },
    { label: 'ч.', nanoseconds: 3600n * NANOSECONDS_PER_SECOND },
    { label: 'мин.', nanoseconds: 60n * NANOSECONDS_PER_SECOND },
    { label: 'сек.', nanoseconds: NANOSECONDS_PER_SECOND },
    { label: 'мс.', nanoseconds: 1000000n },
    { label: 'мкс.', nanoseconds: 1000n },
    { label: 'нс.', nanoseconds: 1n },
];

export function toIsotopeView(dto: IsotopeDTO): IsotopeView {
    const { isotope, ...meta } = dto;
    return {
        ...meta,
        ...isotope,

        halfLifeFormatted:
            isotope.halfLife !== null
                ? formatHalfLife(isotope.halfLife)
                : 'неизвестно',

        fullVideoUrl: isotope.videoUrl
            ? `${MINIO_URL}/${isotope.videoUrl}`
            : null,

        fullImageUrl: isotope.imageUrl
            ? `${MINIO_URL}/${isotope.imageUrl}`
            : null,
    };
}

function formatHalfLife(nanoseconds: bigint) {
    const matchedUnit = TIME_UNITS.find(unit => nanoseconds >= unit.nanoseconds);

    if (!matchedUnit) {
        return `${nanoseconds.toString()} нс.`
    }

    const integerPart = nanoseconds / matchedUnit.nanoseconds;
    const remainder = nanoseconds % matchedUnit.nanoseconds;
    const fractionalPart = (remainder * 100n) / matchedUnit.nanoseconds;

    if (fractionalPart === 0n) {
        return `${integerPart} ${matchedUnit.label}`;
    }


    const fractionString = fractionalPart.toString().padStart(2, '0').replace(/0+$/, '');
    return `${integerPart}.${fractionString} ${matchedUnit.label}`;
}
