/*
 * Copyright (C) 2012-2020  Online-Go.com
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import * as React from "react";
import * as moment from "moment";
import {Link} from "react-router-dom";
import {_, pgettext, interpolate} from "translate";
import {post, get, del} from "requests";
import {openModal, Modal} from "Modal";
import {timeControlDescription} from "TimeControl";
import {GoEngine} from "goban";
import {Player} from "Player";
import {PlayerAutocomplete} from "PlayerAutocomplete";
import {GroupAutocomplete} from "GroupAutocomplete";
import {errorAlerter, rulesText} from "misc";
import {handicapText} from "GameAcceptModal";

interface Events {
}

type ACLModalProperties =
    { game_id: number; }
    | { review_id: number; }
    | { puzzle_collection_id?: number; }
;


export class ACLModal extends Modal<Events, ACLModalProperties, any> {
    refs: {
        player_autocomplete;
        group_autocomplete;
    };

    url:string;
    del_url:string;

    constructor(props) {
        super(props);
        this.state = {
            acl: [],
            selected_player: null,
            selected_group: null,
        };

        if ('game_id' in props) {
            this.url = `games/${props.game_id}/acl`;
            this.del_url = `games/acl/%%`;
        }
        else if ('review_id' in props) {
            this.url = `reviews/${props.review_id}/acl`;
            this.del_url = `reviews/acl/%%`;
        }
        else if ('puzzle_collection_id' in props) {
            this.url = `puzzles/collections/${props.puzzle_collection_id}/acl`;
            this.del_url = `puzzles/collections/acl/%%`;
        }
        else {
            throw new Error(`ACLModal created with invalid parameters`);
        }
    }

    UNSAFE_componentWillMount() {
        this.refresh();
    }
    componentWillUnmount() {
    }
    refresh = () => {
        get(this.url)
        .then((acl) => this.setState({acl: acl}))
        .catch(errorAlerter);
    }

    removeACLEntry(obj) {
        console.log("SHould be removing", obj);
        let new_acl = [];
        for (let entry of this.state.acl) {
            if (!(entry.player_id === obj.player_id && entry.group_id === obj.group_id)) {
                new_acl.push(entry);
            }
        }
        this.setState({acl: new_acl});

        del(this.del_url, obj.id)
        .then(this.refresh)
        .catch((e) => { this.refresh(); errorAlerter(e); });
    }

    playerComplete = (user) => {
        this.setState({selected_player: user});
    }
    groupComplete = (group) => {
        this.setState({selected_group: group});
    }

    grantAccess = () => {
        let player_id = this.state.selected_player && this.state.selected_player.id;
        let group_id = this.state.selected_group && this.state.selected_group.id;

        this.refs.player_autocomplete.clear();
        this.refs.group_autocomplete.clear();

        let obj: any = {};
        if (player_id) {
            obj.player_id = player_id;
        }
        if (group_id) {
            obj.group_id = group_id;
        }
        post(this.url, obj)
        .then(this.refresh)
        .catch(errorAlerter);

        this.setState({
            selected_player: null,
            selected_group: null,
        });
    }


    render() {
        return (
          <div className="Modal ACLModal" ref="modal">
              <div className="header">
                  <h2>{_("Access Control")}</h2>
              </div>
              <div className="body">
                <div className="grant">
                    <PlayerAutocomplete ref="player_autocomplete" onComplete={this.playerComplete} />
                    <GroupAutocomplete ref="group_autocomplete" onComplete={this.groupComplete} />
                    <button className="primary sm" onClick={this.grantAccess} >{_("Grant access")}</button>
                </div>

                <div className="acl-entries">
                    {this.state.acl.map((obj, idx) => (
                        <div key={idx} className="acl-entry">
                            <i className="fa fa-remove clickable" onClick={this.removeACLEntry.bind(this, obj)} />

                            {obj.group_id
                                ? <a target="_blank" href={`/group/${obj.group_id}`} className="group">{obj.group_name}</a>
                                : <Player user={obj.player_id} />
                            }
                        </div>
                    ))}
                </div>
              </div>
              <div className="buttons">
                  <button onClick={this.close}>{_("Close")}</button>
              </div>
          </div>
        );
    }
}

export function openACLModal(props:ACLModalProperties): void {
    openModal(<ACLModal {...props} />);
}

function yesno(tf: boolean) {
    return tf ? _("Yes") : _("No");
}
