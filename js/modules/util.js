export const formatXPSize = (xp) => {

    const formatMB = (xp) => {
        let sizeInMB = (xp / (1000 * 1000)).toFixed(3);
        return `${sizeInMB} MB`;
    };

    const formatKB = (xp) => {
        let sizeInKB;
        if (xp < 100000){
            sizeInKB =  xp / 1000;
            return `${sizeInKB.toFixed(2).toString()} kB`;
        } else {
            sizeInKB = Math.round(xp/1000);
            return `${sizeInKB.toString()} kB`;
        }
    };

    return (xp < 1000000) ? formatKB(xp) : formatMB(xp) 
}