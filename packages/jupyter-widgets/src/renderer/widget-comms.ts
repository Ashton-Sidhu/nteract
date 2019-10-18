import { IClassicComm } from "@jupyter-widgets/base"
import { commOpenAction, commMessageAction } from "@nteract/actions";
import { Dispatch } from "redux";
import { createCommMessage } from "@nteract/epics/lib/comm";

export class WidgetComm implements IClassicComm {
    comm_id: string;
    target_name: string;
    target_module: string;
    store_dispatch: Dispatch;

    constructor(store_dispatch: Dispatch, comm_id: string, target_name:string, target_module: string){
        this.comm_id = comm_id;
        this.target_name = target_name;
        this.target_module = target_module;
        this.store_dispatch = store_dispatch;
    }

    open(data: any, callbacks: any, metadata?: any, buffers?: ArrayBuffer[] | ArrayBufferView[]): string{
        const message = {
            content: {
                comm_id: this.comm_id,
                target_name: this.target_name,
                data,
                metadata
            },
            buffers
        }
        console.log("commopen", message);
        this.store_dispatch(commOpenAction(message));
        // for(let callback of callbacks){
        //     callback();
        // }
        if(callbacks.iopub)
        {
            callbacks.iopub.status({content: {execution_state: "idle"}});
        }
        return "";
    }

    send(data: any, callbacks: any, metadata?: any, buffers?: ArrayBuffer[] | ArrayBufferView[]): string {
        // Send the message
        /*const message = {
            content: {
                comm_id: this.comm_id,
                data
            },
            buffers
        }*/
        const message = createCommMessage(this.comm_id, data, this.flattenBufferArrays(buffers));
        console.log("sending message", message);
        this.store_dispatch(commMessageAction(message));
        // Fire all the callbacks now since dispatch isn't async, so it is done by now
        // for(let callback of callbacks){
        //     callback();
        // }
        if(callbacks.iopub)
        {
            callbacks.iopub.status({content: {execution_state: "idle"}});
        }
        return ""; // It doesn't appear that this is used anywhere, so we'll return an empty string
    }

    close(data?: any, callbacks?: any, metadata?: any, buffers?: ArrayBuffer[] | ArrayBufferView[]): string{
        console.log("close");
    }

     /**
     * Register a message handler
     * @param  callback, which is given a message
     */
    on_msg(callback: (x: any) => void): void{
        console.log("on_msg not implemented");
    }

    /**
     * Register a handler for when the comm is closed by the backend
     * @param  callback, which is given a message
     */
    on_close(callback: (x: any) => void): void{
        console.log("on_close not implemented");
    }

    flattenBufferArrays(buffers?: ArrayBuffer[] | ArrayBufferView[]): Uint8Array | undefined{
        if(buffers === undefined) return undefined;
        let byteLength = 0;
        for(let b of buffers){
            byteLength += b.byteLength;
        }
        let flattened = new Uint8Array(byteLength);
        for(let b of buffers){
            let arr = b instanceof ArrayBuffer ? new Uint8Array(b) : b as Uint8Array;
            flattened.set(arr);
        }
        return flattened;
    }
}