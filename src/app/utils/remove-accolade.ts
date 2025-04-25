
export function RemoveAccolade(dataList: string): string {
    const decodedComment = dataList.replace(/^\{|}$/g, '');

    return decodedComment;
}